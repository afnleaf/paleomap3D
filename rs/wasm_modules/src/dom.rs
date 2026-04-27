/*
* dom.rs
* the only DOM work Rust does is creating the canvas. everything else in
* the HUD (markup, styling, slider interactivity, thumb position, title
* text, arrow disabled state, legend, rail/panel, era/age name table)
* lives in hud.{html,css,js}.
*
* this file also holds a thin two-way bridge between the DOM and Bevy
* so that hud.js and the `CurrentMap` resource stay in sync. both events
* carry just an integer index as `detail`; hud.js owns the MAP_NAMES lookup
* and the broader-era rule.
*
*   JS  -> Rust: window event "paleomap3d:set-index",      detail = <number>
*                -> written to DOM_MAP_INDEX atomic; mapupdate reads it.
*   JS  -> Rust: window event "paleomap3d:set-speed",      detail = <number ms>
*                -> written to DOM_REPEAT_MS atomic; mapupdate retunes its
*                   KeyRepeatTimer so arrow-key cadence matches JS playback.
*   JS  -> Rust: window event "paleomap3d:set-resolution",  detail = 0|1
*                -> written to DOM_RESOLUTION_MODE atomic; 0 = 1deg, 1 = 6min.
*                   poll_resolution_change in lib.rs swaps -1 each frame.
*   JS  -> Rust: window event "paleomap3d:big6min-decoded", detail = Uint8Array
*                -> stashed into BIG6MIN_RAW Mutex; poll_big6min_decoded in
*                   lib.rs takes it and inserts a Big6minData resource.
*   Rust -> JS:  window event "paleomap3d:map-changed",     detail = <number>
*                -> hud.js repaints thumb/title/arrows.
*   Rust -> JS:  window event "paleomap3d:start-decode",    detail = Uint8Array
*                -> hud.js spawns a Worker that calls our exposed
*                   brotli_decode and posts back via big6min-decoded.
*   Rust -> JS:  window event "paleomap3d:6min-ready",      detail = none
*                -> hud.js reveals the resolution-toggle button.
*/

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast; // for unchecked_ref / dyn_into
use web_sys::Event;

use std::sync::atomic::{AtomicI32, Ordering};
use std::sync::Mutex;

// bridge from hud.js pointer/arrow interactions to the Bevy systems.
// -1 means "no change pending", 0..=108 means "DOM wants this index".
pub static DOM_MAP_INDEX: AtomicI32 = AtomicI32::new(-1);

// bridge from the JS speed-cycle button to Bevy's KeyRepeatTimer.
// -1 = no pending change; a positive value is the new repeat period in ms.
pub static DOM_REPEAT_MS: AtomicI32 = AtomicI32::new(-1);

// bridge from the JS resolution-toggle button. -1 = no pending change,
// 0 = 1deg, 1 = 6min. consumer not yet wired (data swap is the next step).
pub static DOM_RESOLUTION_MODE: AtomicI32 = AtomicI32::new(-1);

// hand-off slot for the worker-decoded 6min bytes. JS dispatches
// "paleomap3d:big6min-decoded" with the decoded Uint8Array; the listener
// stashes here, poll_big6min_decoded in lib.rs takes it and turns it
// into a Big6minData resource.
pub static BIG6MIN_RAW: Mutex<Option<Vec<u8>>> = Mutex::new(None);

// function to create and set up the canvas element
// inside the dom
pub fn create_canvas() -> Result<(), JsValue> {
    // window and document DOM
    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();

    // create canvas element
    let canvas = document.create_element("canvas")?;
    let canvas: web_sys::HtmlCanvasElement = canvas
        .dyn_into::<web_sys::HtmlCanvasElement>()
        .unwrap();

    // window dimensions
    let width = window.inner_width()?.as_f64().unwrap() as u32;
    let height = window.inner_height()?.as_f64().unwrap() as u32;

    // Set canvas dimensions and ID
    canvas.set_width(width);
    canvas.set_height(height);
    canvas.set_id("canvas");

    // append canvas to DOM
    document.body().unwrap().append_child(&canvas)?;

    // prevent firefox default drag behavior
    // create closure
    let on_drag_start = Closure::<dyn FnMut(Event)>::new(|event:Event|{
        event.prevent_default();
    });
    // for this specific event
    canvas.add_event_listener_with_callback(
        "dragstart",
        on_drag_start.as_ref().unchecked_ref()
    )?;
    // closure must stay alive or else the callback gets GCd
    // .forget() leaks memeory but its ok
    // this canvas event listener exists for entire lifetime of app
    on_drag_start.forget();

    // wire the JS->Rust half of the bridge (hud.js dispatches set-index
    // when the user drags the slider or clicks the arrows).
    install_set_index_listener(&window)?;
    install_set_speed_listener(&window)?;
    install_set_resolution_listener(&window)?;
    install_big6min_decoded_listener(&window)?;

    // push the initial state out so hud.js can paint index 0 (Present-day).
    // hud.js's DOMContentLoaded listener has already run by the time
    // wasm init completes, so its map-changed listener is attached.
    notify_map_changed(0);

    // console log allows for debugging in browser
    web_sys::console::log_1(&"Canvas created successfully".into());
    moyai()?;
    moyai()?;

    Ok(())
}

// creates big emoji in the browser console
// it funny
fn moyai() -> Result<(), JsValue> {
    /*
    web_sys::console::log_2(
        &JsValue::from_str("%c "),
        &JsValue::from_str("font-size:250px;background:url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><text y='0.95em' font-size='8'>👽</text></svg>\")"),
    );
    */
    web_sys::console::log_2(
        &JsValue::from_str("%c "),
        &JsValue::from_str("font-size:250px;background:url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'><text y='0.95em' font-size='8'>🗿</text></svg>\")"),
    );
    Ok(())
}


// EVENT BRIDGE ---------------------------------------------------------------

// JS -> Rust: hud.js dispatches window CustomEvent("paleomap3d:set-index",
// { detail: <integer index> }) from pointer/drag/arrow handlers. we clamp
// and stash into DOM_MAP_INDEX; mapupdate::map_update_system swaps it out
// each frame and promotes it to the CurrentMap resource.
fn install_set_index_listener(window: &web_sys::Window) -> Result<(), JsValue> {
    let on_set_index = Closure::<dyn FnMut(Event)>::new(|event: Event| {
        let Ok(ce) = event.dyn_into::<web_sys::CustomEvent>() else { return };
        // detail is a plain number (JS: new CustomEvent(..., { detail: idx }))
        let Some(raw) = ce.detail().as_f64() else { return };
        let idx = (raw as i32).clamp(0, 108);
        DOM_MAP_INDEX.store(idx, Ordering::Relaxed);
    });
    window.add_event_listener_with_callback(
        "paleomap3d:set-index",
        on_set_index.as_ref().unchecked_ref(),
    )?;
    // same lifetime-of-app listener pattern as the canvas dragstart closure
    on_set_index.forget();
    Ok(())
}

// JS -> Rust: hud.js dispatches window CustomEvent("paleomap3d:set-speed",
// { detail: <ms> }) when the speed-cycle button advances. the value is
// clamped to a sane range and stashed in DOM_REPEAT_MS; mapupdate swaps
// it out and retunes KeyRepeatTimer so arrow-key repeat follows playback.
fn install_set_speed_listener(window: &web_sys::Window) -> Result<(), JsValue> {
    let on_set_speed = Closure::<dyn FnMut(Event)>::new(|event: Event| {
        let Ok(ce) = event.dyn_into::<web_sys::CustomEvent>() else { return };
        let Some(raw) = ce.detail().as_f64() else { return };
        // clamp to [10, 2000] ms. lower bound stops a runaway zero/negative
        // from making the timer fire every frame; upper bound is arbitrary
        // but larger than any preset we'd realistically offer.
        let ms = (raw as i32).clamp(10, 2000);
        DOM_REPEAT_MS.store(ms, Ordering::Relaxed);
    });
    window.add_event_listener_with_callback(
        "paleomap3d:set-speed",
        on_set_speed.as_ref().unchecked_ref(),
    )?;
    on_set_speed.forget();
    Ok(())
}

// JS -> Rust: hud.js dispatches window CustomEvent("paleomap3d:set-resolution",
// { detail: 0 | 1 }) when the resolution-toggle button is clicked. we stash
// the mode into DOM_RESOLUTION_MODE; poll_resolution_change in lib.rs reads
// and clears it each frame.
fn install_set_resolution_listener(window: &web_sys::Window) -> Result<(), JsValue> {
    let on_set_resolution = Closure::<dyn FnMut(Event)>::new(|event: Event| {
        let Ok(ce) = event.dyn_into::<web_sys::CustomEvent>() else { return };
        let Some(raw) = ce.detail().as_f64() else { return };
        let mode = (raw as i32).clamp(0, 1);
        DOM_RESOLUTION_MODE.store(mode, Ordering::Relaxed);
    });
    window.add_event_listener_with_callback(
        "paleomap3d:set-resolution",
        on_set_resolution.as_ref().unchecked_ref(),
    )?;
    on_set_resolution.forget();
    Ok(())
}

// JS -> Rust: the decoder worker finishes brotli decompression, hud.js
// dispatches window CustomEvent("paleomap3d:big6min-decoded",
// { detail: Uint8Array }). we copy the bytes into a Rust Vec and stash in
// BIG6MIN_RAW; poll_big6min_decoded in lib.rs takes it the next frame.
fn install_big6min_decoded_listener(window: &web_sys::Window) -> Result<(), JsValue> {
    let on_decoded = Closure::<dyn FnMut(Event)>::new(|event: Event| {
        let Ok(ce) = event.dyn_into::<web_sys::CustomEvent>() else { return };
        let detail = ce.detail();
        let Ok(array) = detail.dyn_into::<js_sys::Uint8Array>() else { return };
        let bytes = array.to_vec();
        if let Ok(mut guard) = BIG6MIN_RAW.lock() {
            *guard = Some(bytes);
        }
    });
    window.add_event_listener_with_callback(
        "paleomap3d:big6min-decoded",
        on_decoded.as_ref().unchecked_ref(),
    )?;
    on_decoded.forget();
    Ok(())
}

// Rust -> JS: called from mapupdate when CurrentMap changes (keyboard
// input or accepted DOM input). detail is just the integer index
// hud.js owns MAP_NAMES and turns the index into era/age/broader text.
pub fn notify_map_changed(index: usize) {
    let idx = index.min(108);
    let Some(window) = web_sys::window() else { return };

    let init = web_sys::CustomEventInit::new();
    init.set_detail(&JsValue::from(idx as u32));
    if let Ok(event) = web_sys::CustomEvent::new_with_event_init_dict(
        "paleomap3d:map-changed", &init,
    ) {
        let _ = window.dispatch_event(&event);
    }
}

// Rust -> JS: kicked off once at startup with the embedded big6min.br
// bytes. hud.js spawns a Worker that instantiates wasm_modules in the
// worker context (start() bails when window is None) and calls our
// brotli_decode export. the Uint8Array is a copy on the JS heap (not a
// view of wasm memory) so the worker's transferable postMessage doesn't
// detach our embedded slice.
pub fn notify_start_decode(bytes: &[u8]) {
    let Some(window) = web_sys::window() else { return };
    let array = js_sys::Uint8Array::new_with_length(bytes.len() as u32);
    array.copy_from(bytes);
    let init = web_sys::CustomEventInit::new();
    init.set_detail(array.as_ref());
    if let Ok(event) = web_sys::CustomEvent::new_with_event_init_dict(
        "paleomap3d:start-decode", &init,
    ) {
        let _ = window.dispatch_event(&event);
    }
}

// Rust -> JS: poll_big6min_decoded fires this once the resource is in
// place so hud.js can reveal the (currently hidden) toggle button.
pub fn notify_6min_ready() {
    let Some(window) = web_sys::window() else { return };
    let init = web_sys::CustomEventInit::new();
    if let Ok(event) = web_sys::CustomEvent::new_with_event_init_dict(
        "paleomap3d:6min-ready", &init,
    ) {
        let _ = window.dispatch_event(&event);
    }
}
