// minimal unlit shader for the sun. used instead of StandardMaterial so
// the first-frame shader compile is small enough Firefox WebGL2 doesn't
// stall when the sun first rotates into view.

#import bevy_pbr::forward_io::VertexOutput

struct SunMaterial {
    color: vec4<f32>,
}

@group(2) @binding(0) var<uniform> material: SunMaterial;

@fragment
fn fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    return material.color;
}
