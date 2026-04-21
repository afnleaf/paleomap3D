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
*   JS  -> Rust: window event "paleomap3d:set-index",   detail = <number>
*                -> written to DOM_MAP_INDEX atomic; mapupdate reads it.
*   Rust -> JS:  window event "paleomap3d:map-changed", detail = <number>
*                -> hud.js repaints thumb/title/arrows.
*/

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast; // for unchecked_ref / dyn_into
use web_sys::Event;

use std::sync::atomic::{AtomicI32, Ordering};

// bridge from hud.js pointer/arrow interactions to the Bevy systems.
// -1 means "no change pending", 0..=108 means "DOM wants this index".
pub static DOM_MAP_INDEX: AtomicI32 = AtomicI32::new(-1);

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
