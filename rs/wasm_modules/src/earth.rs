/*
earth.rs

prepares data for shader buffer
load elevation data from assets
create static instance geometry
*/


use std::path::PathBuf;
use std::sync::Arc;

use bevy::{
    prelude::*,
    ecs::{
        query::QueryItem,
    },
    render::{
        extract_resource::ExtractResource,
        extract_component::ExtractComponent,
        view::{
            NoFrustumCulling,
        },
    },
};
use bevy_embedded_assets::EmbeddedAssetReader;
use bytemuck::{Pod, Zeroable};


// NOT IMPLEMENTED
// to determine resolution of data
// based on lat/lon of earth
// 180 lat (-90 to 90 = 181?)
// 360 lon (-180 to 180 = 361?) 
// at 1 degree
// this can be further decomposed into minutes and seconds
// our larger resolution is 6 mins
enum MapSize {
    Deg1, //    65,341
    Min6, // 6,485,401
}


/*
pre processing step to effiently build earth from a single mesh
take .br -> decompress -> get elevation buffer
pre calc base vertices once, calc elevation index
now instance can read elevation grid based on (181, 361) * n
*/ 

// parse elevation buffers ----------------------------------------------------

// internal representation
//#[derive(Resource, Clone)]
// every map's elevations concatenated end-to-end (109 * 181 * 361 i16s,
// widened to i32 for the storage buffer). produced by data/src/main.
// Arc so ExtractResource clone is a refcount bump, not a 28.5 MB memcpy.
#[derive(Resource, Default, Clone, ExtractResource)]
pub struct AllMapData {
    pub buffer: Arc<Vec<i32>>,
    //pub height: usize, // latitude 180
    //pub width: usize, // longitude 360
}

// load elevation from assets folder
pub fn load_elevation_buffers(mut commands: Commands) {
    let buffer = Arc::new(load_and_parse_big1deg());
    println!("loading all map data");
    commands.insert_resource(AllMapData { buffer });
}

// raw 6min elevation bytes after worker brotli decode. layout is the same
// as on disk: 109 maps concatenated, each 1801*3601 i16 little-endian (so
// 6,485,401 elevations per map, ~12.97 MB raw, ~1.41 GB total). kept as
// Vec<u8> because R16Sint texture upload wants raw LE i16 bytes anyway, no
// need to widen on the cpu side.
// Arc so ExtractResource clone is a refcount bump, not a 1.41 GB memcpy.
#[derive(Resource, Clone, ExtractResource)]
pub struct Big6minData {
    pub bytes: Arc<Vec<u8>>,
}

// markers for the two earth entities.
// Earth1deg is documentation-only; the 1deg pipeline still queries by
// InstanceMaterialData. Earth6min is the queue handle for the 6min pipeline,
// extracted into the render world via ExtractComponent.
#[derive(Component, Clone, Copy)]
pub struct Earth1deg;

#[derive(Component, Clone, Copy)]
pub struct Earth6min;

impl ExtractComponent for Earth6min {
    type QueryData = &'static Earth6min;
    type QueryFilter = ();
    type Out = Self;

    fn extract_component(_item: QueryItem<'_, Self::QueryData>) -> Option<Self> {
        Some(Earth6min)
    }
}

// 1801-row LUT, each entry [sin_lat, cos_lat, lon_scale, _].
// uploaded once into a 1801x1 RGBA32F texture. shader reads via
// textureLoad(lat_lut, vec2<i32>(i, 0), 0).
#[derive(Resource, Clone, ExtractResource)]
pub struct LatLutData {
    pub rows: Vec<[f32; 4]>,
}

// 0 = 1deg path, 1 = 6min path. driven by the JS toggle button via
// poll_resolution_change in lib.rs.
#[derive(Resource, Clone, Default, ExtractResource)]
pub struct ResolutionMode {
    pub mode: u8,
}

// 6min cube sizing: lon_scale ~ 0.012 to 0.016 covers the 6-minute grid step
// at the equator (~0.011 world units between cells). matches 1deg path's
// 0.16 base by being exactly 1/10. tuning value, adjust if cubes overlap or
// gap.
pub const BASE_SCALE_6MIN: f32 = 0.016;
pub const MIN_LON_SCALE_6MIN: f32 = 0.75;
pub const LAT_ROWS_6MIN: usize = 1801;
pub const LON_COLS_6MIN: usize = 3601;

// build the lat LUT once when Big6minData arrives. mirrors the 1deg
// CPU-side scale formula (cos(lat) shrunk longitudinally toward poles, with
// a min_lon_scale floor so polar cells don't collapse to a sliver).
// 6min data row 0 is the north pole (lat=+90), so i=0 maps to +pi/2 and
// i=1800 maps to -pi/2 - opposite direction from the 1deg CPU code.
pub fn build_lat_lut(base_scale: f32, min_lon_scale: f32) -> Vec<[f32; 4]> {
    let pi = std::f64::consts::PI;
    let h = LAT_ROWS_6MIN;
    let mut rows = Vec::with_capacity(h);
    for i in 0..h {
        let lat_rad = pi / 2.0 - i as f64 * pi / (h as f64 - 1.0);
        let sin_lat = lat_rad.sin() as f32;
        let cos_lat = lat_rad.cos() as f32;
        let lat_scale = cos_lat.abs();
        let lon_scale =
            base_scale * (min_lon_scale + (1.0 - min_lon_scale) * lat_scale);
        rows.push([sin_lat, cos_lat, lon_scale, 0.0]);
    }
    rows
}

// returns empty vec on failure
fn decompress_elevation(data: &[u8]) -> Vec<u8> {
    let mut decompressor =
        brotli::Decompressor::new(
            std::io::Cursor::new(data), 4096);
    let mut decompressed = Vec::new();
    std::io::Read::read_to_end(&mut decompressor, &mut decompressed)
        .expect("Failed to decompress data");
    decompressed
}

// we do this intermediate step to streamline our i16 internal representation
// have to do this due to endianess of the .br data
fn bytes_to_i16_vec(bytes: &[u8]) -> Vec<i32> {
    bytes
        .chunks_exact(2)
        .map(|c| i16::from_le_bytes([c[0], c[1]]) as i32)
        .collect()
}

// parse all the elevation data here
// big1deg.br is data/src/main's flattened output: 109 maps already
// concatenated before brotli, so one decompress replaces 109
//println!("i16len: {}", elevation_buffer.len());
// on len small or len big switch between 1deg and 6min?
pub fn load_and_parse_big1deg() -> Vec<i32> {
    let embedded = EmbeddedAssetReader::preloaded();
    let file_path = "big1deg.br";
    match embedded.load_path_sync(&PathBuf::from(file_path)) {
        Ok(reader) => {
            // decompress datafile
            // convert to elevation vec of i16s
            let elevation_buffer_raw = decompress_elevation(reader.0);
            bytes_to_i16_vec(&elevation_buffer_raw)
        },
        Err(err) => {
            println!("Failed to load file {}: {:?}", file_path, err);
            Vec::new()
        }
    }
}


// static prism instances -----------------------------------------------------

// the buffer that gets sent to the shader
#[derive(Clone, Copy, Pod, Zeroable)]
#[repr(C)]
pub struct InstanceData {
    position: Vec3,
    scale: Vec3,
    _padding1: [f32; 2],
    rotation: Quat,
    color: [f32; 4],
    elevation_index: u32,
    _padding2: [f32; 3],
}

// all of the instance properties together in a vec as a component
// deref trait when used for a struct wrap around lets the compiler know
// that if a method or field is used on this struct but doesn't exist
// look at the type that it wraps
#[derive(Component, Deref)]
pub struct InstanceMaterialData(Vec<InstanceData>);

// getting out each material component from the vec of instances
// bridge between main world (game logic) and render world (render logic) 
impl ExtractComponent for InstanceMaterialData {
    type QueryData = &'static InstanceMaterialData;
    type QueryFilter = ();
    type Out = Self;

    fn extract_component(
        item: QueryItem<'_, Self::QueryData>
    ) -> Option<Self> {
        Some(InstanceMaterialData(item.0.clone()))
    }
}

// our basic setup (bad still)
pub fn setup_instance_geometries(
    mut commands: Commands, 
    mut meshes: ResMut<Assets<Mesh>>,
) {
    // configure sphere parameters
    let height = 181;
    let width = 361;
    
    // sphere radius (6378km = earth radius)
    let r = 6.378_f64;
    
    // Generate sphere points and convert to InstanceData
    let instance_data: Vec<InstanceData> = 
    (0..height).flat_map(|i| {
            // Map i from [0, height-1] to [-90, 90] degrees (latitude)
            let lat_deg = -90.0 + (i as f64 * 180.0 / (height as f64 - 1.0));
            let lat_rad = lat_deg * std::f64::consts::PI / 180.0;

            // Calculate latitude-based scale
            // smaller at poles, larger at equator
            // cos(lat) gives us 1.0 at equator, ~0 at poles
            
            //let lat_scale = lat_rad.cos() as f32;  
            //let base_scale = 1.0;
            //let min_scale = 0.5;
            //let scaled = base_scale * lat_scale;
            //let mut scale = scaled.max(min_scale);
            //scale = 1.0;
            // Calculate latitude-based scale for longitude compression
            let lat_scale = lat_rad.cos().abs() as f32;  
            
            // Base scale for 1-degree grid cells
            let base_scale = 0.16;   // Overall size at equator
            let min_lon_scale = 0.75; // Minimum longitude scale at poles (20% of equator)
            
            // Non-uniform scaling: 
            // - X and Z (east-west) scale down with latitude
            // - Y (north-south) remains constant
            let lon_scale = base_scale * (min_lon_scale + (1.0 - min_lon_scale) * lat_scale);
            let lat_scale_uniform = base_scale; // Constant for latitude direction
            
            // Create Vec3 scale
            let scale = Vec3::new(
                lon_scale,           // X scale (varies with latitude)
                lat_scale_uniform,   // Y scale (constant)
                lon_scale,           // Z scale (varies with latitude)
            );

            //let lat_factor = lat_rad.cos().abs().sqrt() as f32;
            //let scale = 0.67 * (0.7 + 0.3 * lat_factor);

            (0..width).map(move |j| {
                // Map j from [0, width-1] to [-180, 180] degrees (longitude)
                let lon_deg = -180.0 + (j as f64 * 360.0 / (width as f64 - 1.0));
                let lon_rad = lon_deg * std::f64::consts::PI / 180.0;
                
                // Cartesian conversion
                let x = (r * lat_rad.cos() * lon_rad.sin()) as f32;
                let y = (r * lat_rad.sin()) as f32;
                let z = (r * lat_rad.cos() * lon_rad.cos()) as f32;

                let position = Vec3::new(x, y, z);
                let normal = position.normalize();
                // Calculate rotation to orient the cube outward from origin
                // This rotates from default Y-up to point along the normal
                let rotation = if normal.y.abs() > 0.999 {
                    // Special case for poles to avoid numerical instability
                    if normal.y > 0.0 {
                        Quat::IDENTITY
                    } else {
                        Quat::from_rotation_x(std::f32::consts::PI)
                    }
                } else {
                    Quat::from_rotation_arc(Vec3::Y, normal)
                };

                let color = LinearRgba::from(Color::hsla(
                    (lon_deg + 180.0) as f32, // Hue based on longitude
                    0.7,                      // Saturation
                    0.5,                      // Lightness
                    1.0                       // Alpha
                )).to_f32_array();

                let elevation_index = (i * width + j) as u32;
                //println!("{}", elevation_index);

                InstanceData {
                    position,
                    scale, 
                    _padding1: [0.0; 2],
                    rotation,
                    color,
                    elevation_index,
                    _padding2: [0.0; 3],
                }
            })
        })
        .collect();

    println!("Creating {} instances", instance_data.len());
    println!("InstanceData size: {} bytes", std::mem::size_of::<InstanceData>());
    
    // Spawn the instanced mesh
    commands.spawn((
        Mesh3d(meshes.add(Cuboid::new(1.0, 5.0, 1.0))),
        //Mesh3d(meshes.add(Cylinder::default())),
        //Mesh3d(meshes.add(Tetrahedron::default())),
        InstanceMaterialData(instance_data),
        NoFrustumCulling,
        Earth1deg,
    ));
}

