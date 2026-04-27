// 6min WebGL2 shader. parallel to instancing_webgl2.wgsl, but with no
// per-instance vertex buffer: (i, j) are derived from @builtin(instance_index)
// in the vertex stage. lat trig + lon_scale come from a 1801x1 LUT
// (texture_2d<f32>, RGBA32F). elevation comes from a 3601x1801 R16Sint
// texture indexed by (j, i). draw_indexed instance count is 1801*3601 =
// 6,485,401.

#import bevy_pbr::mesh_functions::{get_world_from_local, mesh_position_local_to_clip}

const PI: f32 = 3.14159265358979323846;
const LON_COLS: u32 = 3601u;
const LON_STEP: f32 = 6.28318530717958647692 / 3600.0; // 2*PI / 3600
const SPHERE_RADIUS: f32 = 6.378;
const ELEV_SCALE: f32 = 0.00005;
const BASE_SCALE: f32 = 0.016;

// group(2):
//   binding 0: lat LUT, 1801x1, RGBA32F.
//              .r = sin_lat, .g = cos_lat, .b = lon_scale, .a = unused.
@group(2) @binding(0) var lat_lut: texture_2d<f32>;
//   binding 1: active elevation, 3601x1801, R16Sint.
//              re-uploaded by prepare_6min_resources on map change.
@group(2) @binding(1) var active_elev: texture_2d<i32>;
//   binding 2: sun position (xyz, w=1). reused from the 1deg pipeline's
//              SunPositionUniformBuffer.
@group(2) @binding(2) var<uniform> sun_position: vec4<f32>;


struct Vertex {
    @builtin(instance_index) inst: u32,
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct CustomVertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) world_normal: vec3<f32>,
    @location(2) world_position: vec3<f32>,
};


fn getColorFromElevation(elevation: f32) -> vec4<f32> {
    if (elevation < -6000.0) {
        return vec4<f32>(8.0 / 255.0, 14.0 / 255.0, 48.0 / 255.0, 1.0);
    } else if (elevation < -3000.0) {
        return vec4<f32>(31.0 / 255.0, 45.0 / 255.0, 71.0 / 255.0, 1.0);
    } else if (elevation < -150.0) {
        return vec4<f32>(42.0 / 255.0, 60.0 / 255.0, 99.0 / 255.0, 1.0);
    } else if (elevation < -50.0) {
        return vec4<f32>(52.0 / 255.0, 75.0 / 255.0, 117.0 / 255.0, 1.0);
    } else if (elevation < 0.0001) {
        return vec4<f32>(87.0 / 255.0, 120.0 / 255.0, 179.0 / 255.0, 1.0);
    } else if (elevation < 75.0) {
        return vec4<f32>(79.0 / 255.0, 166.0 / 255.0, 66.0 / 255.0, 1.0);
    } else if (elevation < 150.0) {
        return vec4<f32>(52.0 / 255.0, 122.0 / 255.0, 42.0 / 255.0, 1.0);
    } else if (elevation < 400.0) {
        return vec4<f32>(0.0 / 255.0, 83.0 / 255.0, 11.0 / 255.0, 1.0);
    } else if (elevation < 1000.0) {
        return vec4<f32>(61.0 / 255.0, 55.0 / 255.0, 4.0 / 255.0, 1.0);
    } else if (elevation < 2000.0) {
        return vec4<f32>(128.0 / 255.0, 84.0 / 255.0, 17.0 / 255.0, 1.0);
    } else if (elevation < 3200.0) {
        return vec4<f32>(151.0 / 255.0, 122.0 / 255.0, 68.0 / 255.0, 1.0);
    } else if (elevation < 5000.0) {
        return vec4<f32>(182.0 / 255.0, 181.0 / 255.0, 181.0 / 255.0, 1.0);
    } else {
        return vec4<f32>(238.0 / 255.0, 238.0 / 255.0, 238.0 / 255.0, 1.0);
    }
}


@vertex
fn vertex(vertex: Vertex) -> CustomVertexOutput {
    var out: CustomVertexOutput;

    let i = vertex.inst / LON_COLS;
    let j = vertex.inst % LON_COLS;

    let row = textureLoad(lat_lut, vec2<i32>(i32(i), 0), 0);
    let sin_lat = row.r;
    let cos_lat = row.g;
    let lon_scale = row.b;

    let lon = -PI + f32(j) * LON_STEP;
    let cos_lon = cos(lon);
    let sin_lon = sin(lon);

    // surface basis at (lat, lon). up is the radial direction; east points
    // along increasing longitude in the local tangent plane; north completes
    // the right-handed frame. valid at the poles (cos_lat == 0).
    let up    = vec3<f32>(cos_lat * sin_lon, sin_lat, cos_lat * cos_lon);
    let east  = vec3<f32>(cos_lon, 0.0, -sin_lon);
    let north = cross(up, east);

    // scale-then-rotate (cube-local space first, then into the basis).
    let scale = vec3<f32>(lon_scale, BASE_SCALE, lon_scale);
    let scaled = vertex.position * scale;
    let rotated = scaled.x * east + scaled.y * up + scaled.z * north;

    let elev_i = textureLoad(active_elev, vec2<i32>(i32(j), i32(i)), 0).r;
    let elev = f32(elev_i);
    let sphere_pos = up * (SPHERE_RADIUS + elev * ELEV_SCALE);
    let final_position = rotated + sphere_pos;

    let world_from_local = get_world_from_local(0u);
    out.clip_position = mesh_position_local_to_clip(
        world_from_local,
        vec4<f32>(final_position, 1.0),
    );

    let rotated_normal =
        vertex.normal.x * east + vertex.normal.y * up + vertex.normal.z * north;
    out.world_normal =
        normalize((world_from_local * vec4<f32>(rotated_normal, 0.0)).xyz);
    out.world_position =
        (world_from_local * vec4<f32>(final_position, 1.0)).xyz;

    out.color = getColorFromElevation(elev);
    return out;
}


@fragment
fn fragment(in: CustomVertexOutput) -> @location(0) vec4<f32> {
    let light_dir = normalize(sun_position.xyz);

    let ambient_color = vec3<f32>(0.25, 0.27, 0.35);
    let ambient = in.color.rgb * ambient_color;

    let sun_color = vec3<f32>(1.0, 1.0, 1.0);

    let n_dot_l = max(dot(in.world_normal, light_dir), 0.0);
    let diffuse = sun_color * n_dot_l * 1.0;

    let view_dir = normalize(-in.world_position);
    let rim = 1.0 - max(dot(view_dir, in.world_normal), 0.0);
    let rim_light = pow(rim, 3.0) * 0.1 * vec3<f32>(0.5, 0.7, 1.0);

    let final_color = in.color.rgb * (ambient + diffuse + rim_light);
    return vec4<f32>(final_color, in.color.a);
}
