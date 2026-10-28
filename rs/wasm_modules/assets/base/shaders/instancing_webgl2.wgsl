// WebGL2 compatible shader
// uses texture lookup instead of storage buffer for elevation data
// naga compiles this WGSL to GLSL ES 3.0 (textureLoad -> texelFetch)
//
// transpiled by claude 4.6 opus max from the webgpu version (instancing.wgsl)

#import bevy_pbr::mesh_functions::{get_world_from_local, mesh_position_local_to_clip}
#import bevy_pbr::mesh_view_bindings::{lights, view}
#import bevy_pbr::lighting::{point_light, spot_light, directional_light}
#import bevy_pbr::mesh_view_bindings::globals


// elevation data packed into a 2D texture (R32Float)
@group(2) @binding(0) var elevation_texture: texture_2d<f32>;
// map_id, points_per_map, texture_width, padding
@group(2) @binding(1) var<uniform> map_selection: vec4<u32>;
// x, y, z, w
@group(2) @binding(2) var<uniform> sun_position: vec4<f32>;


struct Vertex {
    // from vertex buffer 0 (prism mesh)
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    // from vertex buffer 1 (instance data)
    @location(3) i_position: vec3<f32>,
    @location(4) i_scale: vec3<f32>,
    @location(5) i_rotation: vec4<f32>,
    @location(6) i_color: vec4<f32>,
    @location(7) elevation_index: u32,
};

struct CustomVertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) world_normal: vec3<f32>,
    @location(2) world_position: vec3<f32>,
};


fn apply_quaternion_rotation(q: vec4<f32>, v: vec3<f32>) -> vec3<f32> {
    let qvec = q.xyz;
    let qw = q.w;
    let uv = cross(qvec, v);
    let uuv = cross(qvec, uv);
    return v + 2.0 * (uv * qw + uuv);
}


fn getColorFromElevation(elevation: f32) -> vec4<f32> {
    if (elevation < -6000.0) {
        return vec4<f32>(8.0 / 255.0, 14.0 / 255.0, 48.0 / 255.0, 1.0); // 0x080e30
    } else if (elevation < -3000.0) {
        return vec4<f32>(31.0 / 255.0, 45.0 / 255.0, 71.0 / 255.0, 1.0); // 0x1f2d47
    } else if (elevation < -150.0) {
        return vec4<f32>(42.0 / 255.0, 60.0 / 255.0, 99.0 / 255.0, 1.0); // 0x2a3c63
    } else if (elevation < -50.0) {
        return vec4<f32>(52.0 / 255.0, 75.0 / 255.0, 117.0 / 255.0, 1.0); // 0x344b75
    } else if (elevation < 0.0001) {
        return vec4<f32>(87.0 / 255.0, 120.0 / 255.0, 179.0 / 255.0, 1.0); // 0x5778b3
    } else if (elevation < 75.0) {
        return vec4<f32>(79.0 / 255.0, 166.0 / 255.0, 66.0 / 255.0, 1.0);  // 0x4fa642
    } else if (elevation < 150.0) {
        return vec4<f32>(52.0 / 255.0, 122.0 / 255.0, 42.0 / 255.0, 1.0);  // 0x347a2a
    } else if (elevation < 400.0) {
        return vec4<f32>(0.0 / 255.0, 83.0 / 255.0, 11.0 / 255.0, 1.0);   // 0x00530b
    } else if (elevation < 1000.0) {
        return vec4<f32>(61.0 / 255.0, 55.0 / 255.0, 4.0 / 255.0, 1.0);    // 0x3d3704
    } else if (elevation < 2000.0) {
        return vec4<f32>(128.0 / 255.0, 84.0 / 255.0, 17.0 / 255.0, 1.0);   // 0x805411
    } else if (elevation < 3200.0) {
        return vec4<f32>(151.0 / 255.0, 122.0 / 255.0, 68.0 / 255.0, 1.0);  // 0x977944
    } else if (elevation < 5000.0) {
        return vec4<f32>(182.0 / 255.0, 181.0 / 255.0, 181.0 / 255.0, 1.0); // 0xb6b5b5
    } else {
        return vec4<f32>(238.0 / 255.0, 238.0 / 255.0, 238.0 / 255.0, 1.0); // 0xeeeeee
    }
}


@vertex
fn vertex(vertex: Vertex) -> CustomVertexOutput {
    var out: CustomVertexOutput;

    // compute global index into the flattened elevation data
    let global_index =
    map_selection.x * (map_selection.y) + vertex.elevation_index;

    // convert flat index to 2D texture coordinates
    let texture_width = map_selection.z;
    let tex_x = i32(global_index % texture_width);
    let tex_y = i32(global_index / texture_width);

    // read elevation from texture (R32Float, single channel)
    let elevation_meters = textureLoad(elevation_texture, vec2<i32>(tex_x, tex_y), 0).r;

    // position
    let base_sphere_position = vertex.i_position;
    let sphere_radius = length(base_sphere_position);
    let sphere_direction = normalize(base_sphere_position);

    // elevation
    let elevation_world_units = elevation_meters * 0.00005;
    let elevated_instance_pos =
    sphere_direction * (sphere_radius + elevation_world_units);

    // rotate
    let rotated_position =
    apply_quaternion_rotation(vertex.i_rotation, vertex.position);

    // non-uniform scaling
    let scaled_position = rotated_position * vertex.i_scale;

    // adjust elevation position to scale based on lat
    let final_position = scaled_position + elevated_instance_pos;

    out.clip_position = mesh_position_local_to_clip(
        get_world_from_local(0u),
        vec4<f32>(final_position, 1.0)
    );

    // adjust normal
    let rotated_normal =
    apply_quaternion_rotation(vertex.i_rotation, vertex.normal);

    let world_from_local = get_world_from_local(0u);
    out.world_normal =
    normalize((world_from_local * vec4<f32>(rotated_normal, 0.0)).xyz);

    out.world_position =
    (world_from_local * vec4<f32>(final_position, 1.0)).xyz;

    let color = getColorFromElevation(elevation_meters);
    out.color = color;

    return out;
}


@fragment
fn fragment(in: CustomVertexOutput) -> @location(0) vec4<f32> {
    // calculate sun direction from sun position uniform buffer
    let light_dir = normalize(sun_position.xyz);

    // ambient base illumination
    let ambient_color = vec3<f32>(0.25, 0.27, 0.35);
    let ambient = in.color.rgb * ambient_color;

    // sunlight color
    let sun_color = vec3<f32>(1.0, 1.0, 1.0);

    // calculate diffuse lighting from sun direction
    let n_dot_l = max(dot(in.world_normal, light_dir), 0.0);
    let diffuse =  sun_color * n_dot_l * 1.0;

    // rim lighting for atmosphere effect
    let view_dir = normalize(-in.world_position);
    let rim = 1.0 - max(dot(view_dir, in.world_normal), 0.0);
    let rim_light = pow(rim, 3.0) * 0.1 * vec3<f32>(0.5, 0.7, 1.0);

    let final_color = in.color.rgb * (ambient + diffuse + rim_light);

    return vec4<f32>(final_color, in.color.a);
}
