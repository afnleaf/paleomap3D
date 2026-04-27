/*
lib.rs

where we start our bevy app and browser interop
*/

#![allow(dead_code)]
#![allow(unused_variables)]
#![allow(unused_mut)]
//#![feature(trivial_bounds)]

use wasm_bindgen::prelude::*;
use bevy::{
    prelude::*,
    color::palettes::basic::SILVER,
    render::view::NoFrustumCulling,
    time::{Timer, TimerMode},
};
use bevy_embedded_assets::{EmbeddedAssetPlugin, EmbeddedAssetReader, PluginMode};

use std::path::PathBuf;
use std::sync::Arc;
use std::sync::atomic::Ordering;

use crate::mapupdate::KeyRepeatTimer;

mod dom;
mod tools;
mod earth;
mod sun;
mod orbit_camera;
mod mapupdate;

mod instance_pipeline_webgpu;
mod instance_pipeline_webgl2;
mod instance_pipeline_6min_webgl2;
mod render_backend;


//#[cfg(not(target_family = "wasm"))]
//use bevy_dylib;

//mod camera;

// entry point for WASM
#[wasm_bindgen(start)]
pub fn start() {
    // panic hook helps in both main and worker contexts
    console_error_panic_hook::set_once();
    // the offload decoder worker (hud.js) instantiates this same binary so
    // it can call brotli_decode below. workers have no window, bail before
    // any DOM-touching setup.
    if web_sys::window().is_none() { return; }
    web_sys::console::log_1(&"Starting Bevy WASM application".into());
    // create canvas and add to document
    dom::create_canvas().expect("Failed to create canvas");
    // disable right click
    //document.addEventListener('contextmenu', event => event.preventDefault());
    //todo!();
    // start app
    start_bevy();
}

// exposed so the offload worker (spawned by hud.js) can decompress brotli
// on a separate browser thread. touches no globals or DOM, safe in any
// context.
#[wasm_bindgen]
pub fn brotli_decode(input: &[u8]) -> Vec<u8> {
    let mut decoder = brotli::Decompressor::new(
        std::io::Cursor::new(input),
        4096,
    );
    let mut output = Vec::new();
    let _ = std::io::Read::read_to_end(&mut decoder, &mut output);
    output
}

pub fn start_bevy() {
    // initialize Bevy
    let mut app = App::new();
    
    // PLUGINS
    // embed all files in assets folder into the binary
    // this replaces the default bevy asset plugin
    app.add_plugins(EmbeddedAssetPlugin {
        mode: PluginMode::ReplaceDefault,
    });
    // add default plugins
    app.add_plugins(
        DefaultPlugins.set(WindowPlugin {
            primary_window: Some(Window {
                // use the canvas we just created
                // is there a better way to do this?
                canvas: Some("#canvas".to_string()),
                fit_canvas_to_parent: true,
                prevent_default_event_handling: false,
                ..default()
            }),
            ..default()
        }),
    );
    // our custom render pipeline that enables instanced geometry
    // render_backend detects WebGPU vs WebGL2 and picks the right pipeline
    app.add_plugins(render_backend::RenderBackendPlugin);
    // tiny unlit material for the sun, kept separate from the earth's
    // pipeline so the freeze doesn't come back the first time the sun
    // enters the frustum.
    app.add_plugins(MaterialPlugin::<sun::SunMaterial>::default());
    
    //web_sys::console::log_1(&"TEST 1".into());
    // add rest
    app.insert_resource(KeyRepeatTimer(
        Timer::from_seconds(0.1, TimerMode::Repeating)));
    app.insert_resource(ClearColor(Color::srgb(0.0, 0.0, 0.0))); // black bg
    //web_sys::console::log_1(&"TEST 2".into());
    app.add_plugins(bevy::diagnostic::FrameTimeDiagnosticsPlugin::default());
    //web_sys::console::log_1(&"TEST 3".into());
    app.init_resource::<crate::mapupdate::CurrentMap>();
    // ResolutionMode starts at 0 (1deg). poll_resolution_change rewrites it
    // when the JS toggle button fires; queue_custom (1deg) early-returns
    // when mode != 0; the 6min pipeline gates its upload + queue on mode == 1.
    app.init_resource::<earth::ResolutionMode>();
    
    app.add_systems(Startup,(
        sun::spawn_sun_geocentrism,
        (
            earth::load_elevation_buffers,
            earth::setup_instance_geometries,
        ).chain(),
        initial_setup,
        kick_off_6min_decode,
    ).chain());

    //web_sys::console::log_1(&"TEST 4".into());
    app.add_systems(PostStartup,
                orbit_camera::spawn_orbit_camera,
        );
    //web_sys::console::log_1(&"TEST 5".into());
    app.add_systems(
            Update,
            (
                //tools::fps_update_system,
                orbit_camera::orbit_camera_system
                    .run_if(any_with_component::<orbit_camera::OrbitState>),
                sun::orbit_geocentrism,
                (
                    mapupdate::map_update_system,
                    mapupdate::update_map_text_display,
                ).chain(),
                poll_big6min_decoded,
                poll_resolution_change,
            ),
        );
    //web_sys::console::log_1(&"TEST 6".into());
    app.run();
    //web_sys::console::log_1(&"IDK WHAT ISNT WORKING".into());
}

// set some base stuff in the scene
fn initial_setup(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    asset_server: Res<AssetServer>,
) {
    // ground -----------------------------------------------------------------
    //ground_plane(&mut commands, &mut meshes, &mut materials);
    //sphere(&mut commands, &mut meshes, &mut materials);

    //sun::ambient_light(&mut commands);
    //tools::fps_widget(&mut commands);
    //mapupdate::current_map_widget(&mut commands);
}

// startup: hand the embedded big6min.br bytes to hud.js so a Worker can
// brotli-decompress them off the main thread. fires once at boot. the
// decoded bytes come back via the BIG6MIN_RAW Mutex (paleomap3d:big6min-decoded
// JS->Rust event) and are picked up by poll_big6min_decoded below.
fn kick_off_6min_decode() {
    let embedded = EmbeddedAssetReader::preloaded();
    match embedded.load_path_sync(&PathBuf::from("big6min.br")) {
        Ok(reader) => {
            web_sys::console::log_2(
                &"paleomap3d: kicking off 6min decode, compressed bytes =".into(),
                &JsValue::from(reader.0.len() as u32),
            );
            dom::notify_start_decode(reader.0);
        }
        Err(err) => {
            web_sys::console::log_2(
                &"paleomap3d: failed to load big6min.br".into(),
                &JsValue::from_str(&format!("{:?}", err)),
            );
        }
    }
}

// update: every frame, take ownership of any decoded buffer the JS listener
// has stashed in BIG6MIN_RAW. when present, install Big6minData (Arc-wrapped
// so render-world extract is a refcount bump, not a 1.41 GB clone), build
// the lat LUT, spawn the 6min mesh entity, and tell hud.js to reveal the
// toggle button. cheap no-op every other frame (lock + take of an empty
// Option).
fn poll_big6min_decoded(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
) {
    let bytes = match dom::BIG6MIN_RAW.lock() {
        Ok(mut guard) => guard.take(),
        Err(_) => return,
    };
    if let Some(bytes) = bytes {
        let len = bytes.len();
        commands.insert_resource(earth::Big6minData {
            bytes: Arc::new(bytes),
        });

        let lut = earth::build_lat_lut(
            earth::BASE_SCALE_6MIN,
            earth::MIN_LON_SCALE_6MIN,
        );
        web_sys::console::log_2(
            &"paleomap3d: 6min LUT built, rows =".into(),
            &JsValue::from(lut.len() as u32),
        );
        commands.insert_resource(earth::LatLutData { rows: lut });

        // 6min entity: same prism mesh as 1deg, but no instance buffer.
        // shader derives (i, j) from @builtin(instance_index). NoFrustumCulling
        // because the base mesh sits at the origin while the shader scatters
        // 6.5M instances across the sphere - bevy can't see them.
        commands.spawn((
            Mesh3d(meshes.add(Cuboid::new(1.0, 5.0, 1.0))),
            earth::Earth6min,
            NoFrustumCulling,
        ));

        web_sys::console::log_2(
            &"paleomap3d: 6min entity spawned, Big6minData inserted, bytes =".into(),
            &JsValue::from(len as u32),
        );
        dom::notify_6min_ready();
    }
}

// update: read+clear the resolution-toggle atomic and promote any pending
// change to the ResolutionMode resource. Extracted into the render world
// each frame; queue_custom (1deg) early-returns on mode != 0 and the 6min
// pipeline gates upload + queue on mode == 1.
fn poll_resolution_change(mut resolution: ResMut<earth::ResolutionMode>) {
    let mode = dom::DOM_RESOLUTION_MODE.swap(-1, Ordering::Relaxed);
    if mode < 0 { return; }
    let new_mode = mode.clamp(0, 1) as u8;
    web_sys::console::log_2(
        &"paleomap3d: resolution change consumed, mode =".into(),
        &JsValue::from(new_mode as i32),
    );
    if resolution.mode != new_mode {
        resolution.mode = new_mode;
    }
}

fn ground_plane(
    commands: &mut Commands,
    meshes: &mut ResMut<Assets<Mesh>>,
    //materials: Handle<StandardMaterial>,
    materials: &mut ResMut<Assets<StandardMaterial>>,
) {
    commands.spawn((
        Mesh3d(meshes.add(Plane3d::default().mesh().size(50.0, 50.0).subdivisions(10))),
        MeshMaterial3d(materials.add(Color::from(SILVER))),
    ));
}

fn sphere(
    commands: &mut Commands,
    meshes: &mut ResMut<Assets<Mesh>>,
    //materials: Handle<StandardMaterial>,
    materials: &mut ResMut<Assets<StandardMaterial>>,
) {
    commands.spawn((
        Mesh3d(meshes.add(Sphere::new(6.378))),
        MeshMaterial3d(materials.add(StandardMaterial {
            base_color: Color::srgba(0.0, 1.0, 0.0, 0.3), // Semi-transparent green
            alpha_mode: AlphaMode::Blend,
            double_sided: true,
            cull_mode: None,
            ..default()
        })),
        Transform::from_xyz(0.0, 0.0, 0.0),
    ));
}

