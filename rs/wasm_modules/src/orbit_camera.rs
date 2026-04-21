/* 
orbit_camera.rs

This is an experimental LLM generated file. (I have since done minor refactor)
I took https://www.npmjs.com/package/three-orbitcontrols?activeTab=code
+ https://bevy-cheatbook.github.io/cookbook/pan-orbit-camera.html
then put it into an LLM asking for Rust code. Honestly, the results are subpar.
Tried Sonnet 3.7 Thinking, Gemini 2.5 Pro, Grok 3 Think

I could probably figure this out myself but this felt like a good experiment
for LLMs. Take some existing code and transform it into another language.
The solution is already there, no problem solving required, just translate. 
Basically the ideal use case for an LLM. Pure vibe coding.

Edited with claude 4.6 opus max in 2026/04
*/


// Grok 3 version
// I fix width when too long, also added the R to reset
use bevy::{
    prelude::*,
    input::mouse::{
        MouseButton, MouseMotion, MouseScrollUnit, MouseWheel
    },
    render::view::{NoIndirectDrawing},
    window::{Window, PrimaryWindow},
};

// Tuning constants for input-to-rate conversion.
// Not exposed via OrbitSettings because they're internal feel knobs,
// not user-facing config.
const ROTATION_EPSILON:     f32 = 0.000001;
// three.js getMouseOnCircle: delta scaled by (2 / screen_width).
const SCROLL_LINE_SENS:     f32 = 0.01;
const SCROLL_PIXEL_SENS:    f32 = 0.00025;
const MOUSE_ROTATE_SCALE:   f32 = 3.0;
const MOUSE_PAN_SCALE:      f32 = 0.01;
const MOUSE_TWIST_SENS:     f32 = 0.005;
const MOUSE_TILT_SENS:      f32 = 0.005;
// touch only
const TOUCH_PINCH_SENS:     f32 = 0.0008;
// Rotation already divides by screen_width, so touch delta feeds in 1:1
const TOUCH_ROTATE_SENS:    f32 = 0.001;

// Bundle to spawn our orbit camera easily
#[derive(Bundle, Default)]
pub struct OrbitCameraBundle {
    pub camera: Camera3d,
    pub state: OrbitState,
    pub settings: OrbitSettings,
}

// The internal state of the orbit controller
#[derive(Component)]
pub struct OrbitState {
    pub target: Vec3,        // The point being orbited around
    pub position: Vec3,      // Current camera position
    pub up: Vec3,            // Camera's up vector
    pub rotation_quat: Quat, // Current rotation as quaternion
    pub distance: f32,       // Distance from target
    pub moving: bool,        // Whether the camera is being moved
    pub last_rotation_axis: Option<Vec3>, // For rotation damping
    pub last_rotation_angle: f32,  // For rotation damping
    //pub last_position: Vec3, // For detecting changes
    //pub velocity: Vec3,      // For pan damping
}


impl OrbitState {
    const DEFAULT_DISTANCE: f32 = 22.0;
    const DEFAULT_POSITION: Vec3 = Vec3::new(0.0, 0.0, Self::DEFAULT_DISTANCE);
}

impl Default for OrbitState {
    fn default() -> Self {
        OrbitState {
            target: Vec3::ZERO,
            position: Self::DEFAULT_POSITION,
            up: Vec3::Y,
            rotation_quat: Quat::IDENTITY,
            distance: Self::DEFAULT_DISTANCE,
            moving: false,
            last_rotation_axis: None,
            last_rotation_angle: 0.0,
            //last_position: Self::DEFAULT_POSITION,
            //velocity: Vec3::ZERO,       // is this used?
        }
    }
}

// The configuration of the orbit controller
#[derive(Component)]
pub struct OrbitSettings {
    pub rotate_speed: f32,
    pub zoom_speed: f32,
    pub pan_speed: f32,
    pub static_moving: bool,  // If true, no damping is applied
    pub damping_factor: f32,  // For non-static movement (lower = more damping)
    pub min_distance: f32,    // Minimum distance from target
    pub max_distance: f32,    // Maximum distance from target
    pub no_rotate: Option<bool>,
    pub no_zoom: Option<bool>,
    pub no_pan: Option<bool>,
    pub rotate_button: MouseButton,
    pub twist_button: MouseButton,
    pub pan_button: MouseButton,
    pub keys: [KeyCode; 4],
}

impl Default for OrbitSettings {
    fn default() -> Self {
        OrbitSettings {
            rotate_speed: 1.0,
            zoom_speed: 3.5,
            pan_speed: 0.1,
            static_moving: false,
            damping_factor: 0.2,
            min_distance: 0.0001,
            max_distance: f32::INFINITY,
            no_rotate: Some(false),
            no_zoom: Some(false),
            no_pan: Some(false),
            rotate_button: MouseButton::Left,
            twist_button: MouseButton::Middle,
            pan_button: MouseButton::Right,
            keys: [
                KeyCode::KeyA,
                KeyCode::KeyS, 
                KeyCode::KeyD,
                KeyCode::KeyR,
            ],
        }
    }
}

pub fn spawn_orbit_camera(mut commands: Commands) {
    let mut camera = OrbitCameraBundle::default();
    commands.spawn((camera, NoIndirectDrawing));
}

pub fn orbit_camera_system(
    time: Res<Time>,
    mouse_button: Res<ButtonInput<MouseButton>>,
    kbd: Res<ButtonInput<KeyCode>>,
    touches: Res<Touches>,
    mut evr_motion: EventReader<MouseMotion>,
    mut evr_scroll: EventReader<MouseWheel>,
    primary_window_query: Query<&Window, With<PrimaryWindow>>,
    mut q_camera: Query<(&OrbitSettings, &mut OrbitState, &mut Transform)>,
) {
    // Get the primary window
    let Ok(window) = primary_window_query.single() else { return };
    //let screen_width = window.expect("REASON").width();
    let screen_width = window.width();

    // Accumulate mouse motion
    let mut mouse_delta: Vec2 = evr_motion.read().map(|ev| ev.delta).sum();

    // Accumulate scroll
    let mut scroll_delta = 0.0;
    for ev in evr_scroll.read() {
        match ev.unit {
            MouseScrollUnit::Line => scroll_delta -= ev.y * SCROLL_LINE_SENS,
            MouseScrollUnit::Pixel => scroll_delta -= ev.y * SCROLL_PIXEL_SENS,
        }
    }

    // Touch gestures
    // 1 finger drag = rotate (feeds mouse_delta like the rotate button)
    // 2 finger pinch = zoom
    // we just shovel touch deltas into mouse_delta / scroll_delta so the
    // existing rotate/pan/zoom code picks them up unchanged
    let active_touches: Vec<_> = touches.iter().collect();
    let mut touch_rotate_active = false;
    let touch_pan_active = false;
    let mut touch_zoom_active = false;
    match active_touches.len() {
        1 => {
            touch_rotate_active = true;
            mouse_delta += active_touches[0].delta() * TOUCH_ROTATE_SENS;
        }
        2 => {
            let t1 = active_touches[0];
            let t2 = active_touches[1];
            // pinch: fingers moving apart = zoom in
            let prev_dist =
                (t1.previous_position() - t2.previous_position()).length();
            let curr_dist = (t1.position() - t2.position()).length();
            let pinch = curr_dist - prev_dist;
            if pinch != 0.0 {
                touch_zoom_active = true;
                scroll_delta -= pinch * TOUCH_PINCH_SENS;
            }
        }
        _ => {}
    }

    for (settings, mut state, mut transform) in &mut q_camera {
        // Reset check on KEY_R
        if kbd.just_pressed(settings.keys[3]) {
            *state = OrbitState::default();
        }

        // Input states
        let twist_active = mouse_button.pressed(settings.twist_button);
        let rotate_active =
            (!settings.no_rotate.unwrap_or(false)) &&
            !twist_active &&
            (mouse_button.pressed(settings.rotate_button) ||
            kbd.pressed(settings.keys[0]) ||
            touch_rotate_active);
        let zoom_active =
            (!settings.no_zoom.unwrap_or(false)) &&
            (kbd.pressed(settings.keys[1]) ||
            scroll_delta != 0.0 ||
            touch_zoom_active);
        let pan_active =
            (!settings.no_pan.unwrap_or(false)) &&
            (mouse_button.pressed(settings.pan_button) ||
            kbd.pressed(settings.keys[2]) ||
            touch_pan_active);

        state.moving = 
            rotate_active || zoom_active || pan_active || twist_active;

        // Rotation
        if rotate_active && mouse_delta != Vec2::ZERO {
            // Scale mouse delta like getMouseOnCircle
            let dx = MOUSE_ROTATE_SCALE * mouse_delta.x / screen_width;
            let dy = -MOUSE_ROTATE_SCALE * mouse_delta.y / screen_width;

            let eye = state.position - state.target;
            let eye_direction = eye.normalize_or_zero();
            let up_direction = transform.up();
            let sideways_direction = 
                up_direction.cross(eye_direction).normalize_or_zero();

            let move_direction = sideways_direction * dx + up_direction * dy;
            let move_length = move_direction.length();

            if move_length > ROTATION_EPSILON {
                let axis = move_direction.cross(eye).normalize_or_zero();
                let angle = move_length * settings.rotate_speed;
                let delta_quat = Quat::from_axis_angle(axis, angle);

                // Apply rotation
                state.rotation_quat = delta_quat * state.rotation_quat;

                // Store for damping
                if !settings.static_moving {
                    state.last_rotation_axis = Some(axis);
                    state.last_rotation_angle = angle;
                }
            }
        } else if
            !settings.static_moving &&
            state.last_rotation_angle > ROTATION_EPSILON
        {
            // Apply damping
            state.last_rotation_angle *= 1.0 - settings.damping_factor;
            if let Some(axis) = state.last_rotation_axis {
                let delta_quat = 
                    Quat::from_axis_angle(axis, state.last_rotation_angle);
                state.rotation_quat = delta_quat * state.rotation_quat;
            }
            // Reset if angle becomes negligible
            if state.last_rotation_angle < ROTATION_EPSILON {
                state.last_rotation_axis = None;
                state.last_rotation_angle = 0.0;
            }
        }

        // Zoom on mouse wheel scroll (direct, no damping)
        if zoom_active && scroll_delta != 0.0 {
            let factor = 1.0 + scroll_delta * settings.zoom_speed;
            state.distance = 
                (state.distance * factor)
                .clamp(settings.min_distance, settings.max_distance);
        }

        // Pan
        if pan_active && mouse_delta != Vec2::ZERO {
            let pan_scale = state.distance * settings.pan_speed;
            let right = transform.right();
            let up = transform.up();
            let mouse_change = Vec2::new(
                -mouse_delta.x * MOUSE_PAN_SCALE, mouse_delta.y * MOUSE_PAN_SCALE);
            let pan_delta = (right * mouse_change.x +
                up * mouse_change.y) * pan_scale;

            state.target += pan_delta;

            // not used for damping
            //if !settings.static_moving {
            //    state.velocity += pan_delta
            //}
        }

        // Twist, roll around eye axis
        if twist_active && mouse_delta.x != 0.0 {
            let twist_angle = -mouse_delta.x * MOUSE_TWIST_SENS;
            let eye = state.position - state.target;
            let eye_axis = eye.normalize_or_zero();
            if eye_axis != Vec3::ZERO {
                let twist_quat = Quat::from_axis_angle(eye_axis, twist_angle);
                state.rotation_quat = twist_quat * state.rotation_quat;
            }
        }
        // vertical twist
        if twist_active && mouse_delta.y != 0.0 {
            let tilt_angle = mouse_delta.y * MOUSE_TILT_SENS;
            let horizontal_axis = Vec3::from(transform.right());
            let tilt_quat = Quat::from_axis_angle(horizontal_axis, tilt_angle);
            state.rotation_quat = tilt_quat * state.rotation_quat;
        }


        // **Damping for Pan**
        /*
        if 
        !settings.static_moving && 
        !state.moving && 
        state.velocity.length_squared() > 0.000001 {
            state.velocity *= 1.0 - settings.damping_factor;
            if state.velocity.length_squared() < 0.000001 {
                state.velocity = Vec3::ZERO;
            }
        }
        */

        // Update Transform
        transform.rotation = state.rotation_quat;
        let offset = transform.back() * state.distance;
        transform.translation = state.target + offset;
        state.position = transform.translation;

        // Ensure distance constraints
        let eye = state.position - state.target;
        let eye_length = eye.length();
        if eye_length > settings.max_distance {
            state.distance = settings.max_distance;
            transform.translation = 
                state.target + eye.normalize() * settings.max_distance;
            state.position = transform.translation;
        } else if eye_length < settings.min_distance {
            state.distance = settings.min_distance;
            transform.translation = 
                state.target + eye.normalize() * settings.min_distance;
            state.position = transform.translation;
        }
    }
}

