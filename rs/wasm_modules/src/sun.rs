/*
sun.rs

the code that spawns and orbits the sun
*/
use bevy::{
    //color::palettes::css::*,
    pbr::{
        //CascadeShadowConfigBuilder,
        Material, NotShadowCaster,
        //NotShadowReceiver
    },
    render::{
        mesh::*,
        //extract_component::{ExtractComponent},
        extract_resource::{ExtractResource},
        render_resource::{AsBindGroup, ShaderRef},
    },
    prelude::*,
    asset::Asset,
    reflect::TypePath,
};
use std::f32::consts::PI;

/*
Illuminance (lux)	Surfaces illuminated by
0.0001	        Moonless, overcast night sky (starlight)
0.002	        Moonless clear night sky with airglow
0.05–0.3	    Full moon on a clear night
3.4	            Dark limit of civil twilight under a clear sky
20–50       	Public areas with dark surroundings
50	            Family living room lights
80	            Office building hallway/toilet lighting
100	            Very dark overcast day
150	            Train station platforms
320–500	        Office lighting
400	            Sunrise or sunset on a clear day.
1000	        Overcast day; typical TV studio lighting
10,000–25,000	Full daylight (not direct sun)
32,000–100,000	Direct sunlight
*/


// refactor the sun
// there is functionality that we need to change here
// first, managing Sun position, for lighting shader
// second, moving away from geocentris
// is the Star a component or an Entity?
// how can an Entity have a star component?
// is center the position in vec3?
// why do our instances not interact with this light?
//

#[derive(Component)]
pub struct Star;

//#[derive(Resource, Default, Clone, ExtractResource)]
//pub struct CurrentMap {
//    pub index: usize,
//}
//need position and light direction?
//or is light direction calced, from pos to 0,0,0?
//#[derive(Default, Clone, Component, ExtractComponent)]
#[derive(Default, Clone, Resource, ExtractResource)]
pub struct SunPosition {
    pub pos: Vec3
}

#[derive(Component, Clone)]
pub struct Orbit {
    pub speed: f32,
    pub axis: Vec3,
    pub center: Vec3,
}

const DAY: f32 = PI / 256.0;
const LUX: f32 = 3200.0;
// earth's axial tilt: sun's daily circle sits 23.4 deg above the equator
// (frozen at june solstice; flip sign for december)
const DECLINATION_DEG: f32 = 23.4;
pub const INITIAL_SUN_POSITION: Vec3 = Vec3::new(149_000.0, 0.0, 0.0);

// minimal unlit material for the sun: a single uniform color, fragment
// shader returns it. swapped in for StandardMaterial because Firefox WebGL2
// took ~2-3s to link the full PBR shader the first time the sun rotated
// into the camera frustum.
#[derive(Asset, AsBindGroup, TypePath, Clone)]
pub struct SunMaterial {
    #[uniform(0)]
    pub color: LinearRgba,
}

impl Material for SunMaterial {
    fn fragment_shader() -> ShaderRef {
        "shaders/sun.wgsl".into()
    }
}

// Startup system, create light and sun
pub fn spawn_sun_geocentrism(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut sun_materials: ResMut<Assets<SunMaterial>>,
) {
    // Sun is 149 million km away from earth
    // geocentric model
    let initial_light_position = INITIAL_SUN_POSITION;
    let target_point = Vec3::ZERO; 
    let up_direction = Vec3::Y;
    let orbit = Orbit {
        speed: DAY,
        axis: Vec3::Y,
        center: target_point,
    };
    
    // light source itself
    //commands.spawn((
    //    DirectionalLight {
    //        //color: Color::WHITE,
    //        illuminance: LUX,
    //        shadows_enabled: true,
    //        shadow_depth_bias: DirectionalLight::DEFAULT_SHADOW_DEPTH_BIAS,
    //        shadow_normal_bias: DirectionalLight::DEFAULT_SHADOW_NORMAL_BIAS,
    //        ..default()
    //    },
    //    // Its position and initial orientation
    //    Transform::from_translation(initial_light_position)
    //        .looking_at(target_point, up_direction),
    //    // Marker component for the system to find it
    //    Star,
    //    orbit.clone(),
    //));

    // sphere at the same position as real sun relative to our solar system size
    // earth is 6.738
    commands.spawn((
        Mesh3d(meshes.add(Sphere::new(696.34).mesh().uv(32, 18))),
        MeshMaterial3d(sun_materials.add(SunMaterial {
            color: LinearRgba::new(1.0, 1.0, 0.0, 1.0),
        })),
        NotShadowCaster,
        Transform::from_translation(initial_light_position),
        Star,
        orbit.clone(),
    ));

    // pre-warm the SunMaterial pipeline at startup. without this the first
    // shader compile happens the first time the actual sun rotates into the
    // frustum, which is a small but noticeable hitch on Firefox. tiny sphere
    // at origin is occluded by the earth cuboids so it's invisible.
    commands.spawn((
        Mesh3d(meshes.add(Sphere::new(0.001))),
        MeshMaterial3d(sun_materials.add(SunMaterial {
            color: LinearRgba::new(1.0, 1.0, 0.0, 1.0),
        })),
        Transform::from_xyz(0.0, 0.0, 0.0),
    ));
    
    // global sun position resource for shader
    commands.insert_resource(SunPosition {
        pos: initial_light_position,
    });
}

// Update system, orbits sun around earth at 0,0,0
pub fn orbit_geocentrism(
    mut query: Query<(&mut Transform, &Orbit), With<Star>>,
    mut sun_position: ResMut<SunPosition>,
    time: Res<Time>,
) {
    for (mut transform, orbit) in &mut query {
        // total elapsed time instead of delta time 
        // allows for smoother and more predictable movement
        let total_time = time.elapsed_secs();
        
        // how far away sun is from earth
        let radius = 149_000.0;
        let angle = orbit.speed * total_time;
        let declination = DECLINATION_DEG.to_radians();
        let r_eq = radius * declination.cos();
        // calc new position in orbit directly using sine and cosine
        let new_x = r_eq * angle.cos();
        let new_z = r_eq * angle.sin();
        let new_y = radius * declination.sin();

        // set new position and point at 0,0,0
        let new_position = Vec3::new(new_x, new_y, new_z);
        transform.translation = new_position;
        transform.look_at(Vec3::ZERO, Vec3::Y);

        // update sun resource
        sun_position.pos = new_position;
        
        //println!("Light at ({}, 0, {}), angle: {}", new_x, new_z, angle);
    }
}


pub fn ambient_light(
    mut commands: &mut Commands,
) {
    commands.insert_resource(AmbientLight {
        //color: WHITE.into(),
        //brightness: 250.0,
        brightness: 1400.0,
        ..default()
    });
}


    /*
    commands.spawn((
        PointLight {
            shadows_enabled: true,
            intensity: 10_000_000.,
            range: 100.0,
            shadow_depth_bias: 0.2,
            ..default()
        },
        Transform::from_xyz(-16.0, 0.0, -16.0),
    ));
    
    commands.spawn((
        PointLight {
            shadows_enabled: true,
            intensity: 10_000_000.,
            range: 100.0,
            shadow_depth_bias: 0.2,
            ..default()
        },
        Transform::from_xyz(16.0, 0.0, 16.0),
    ));
    */
        
    /*
    // Mesh component - a sphere
    PbrBundle {
        mesh: meshes.add(Mesh::from(shape::Sphere { radius: 0.3 })),
        material: materials.add(StandardMaterial {
            base_color: Color::YELLOW,
            emissive: Color::YELLOW * 2.0, // Make it glow
            ..default()
        }),
        transform: Transform::from_translation(initial_light_position),
        ..default()
    },
    */
