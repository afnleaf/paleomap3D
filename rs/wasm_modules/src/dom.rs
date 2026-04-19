/*
* dom.rs
* the functions in this file interact with the DOM in the browser
* creates the canvas and HUD overlay elements (title, slider, legend, etc.)
*/

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast; // for unchecked_ref
use web_sys::Event;

use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};

use crate::mapnames;

// shared state between DOM callbacks and Bevy systems
// -1 means "no change from DOM", 0..=108 means "DOM wants this index"
pub static DOM_MAP_INDEX: AtomicI32 = AtomicI32::new(-1);
// track fullscreen toggle state
pub static DOM_FULLSCREEN: AtomicI32 = AtomicI32::new(0);
// mirror of the index the DOM is currently displaying.
// arrow buttons read this to compute "current ± 1" since the
// div-based slider has no input.value() to read back from.
pub static DOM_DISPLAYED_INDEX: AtomicI32 = AtomicI32::new(0);
// true while a pointer drag is in progress on the slider
static DRAGGING: AtomicBool = AtomicBool::new(false);

// shorthand for the window().document() chain we'd otherwise repeat in every closure
fn doc() -> web_sys::Document {
    web_sys::window().unwrap().document().unwrap()
}

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

    // inject the HUD stylesheet
    //inject_hud_css(&document)?;
    // create the HUD overlay elements
    create_hud(&document)?;

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


// HUD OVERLAY ----------------------------------------------------------------

//fn inject_hud_css(document: &web_sys::Document) -> Result<(), JsValue> {
//    let style = document.create_element("style")?;
//    style.set_text_content(Some(HUD_CSS));
//    document.head().unwrap().append_child(&style)?;
//    Ok(())
//}

fn create_hud(document: &web_sys::Document) -> Result<(), JsValue> {
    let body = document.body().unwrap();

    // title - geological era name
    let title = document.create_element("p")?;
    title.set_id("title");
    title.set_inner_html(&mapnames::get_map_title_html(0));
    body.append_child(&title)?;

    // controls HUD (slider + arrows + fullscreen)
    let controlshud = document.create_element("div")?;
    controlshud.set_attribute("class", "controlshud")?;

    // arrow container
    let arrow_container = document.create_element("div")?;
    arrow_container.set_attribute("class", "arrow-container")?;

    // left arrow button
    let arrow_left = document.create_element("button")?;
    arrow_left.set_id("arrow-left");
    arrow_left.set_attribute("class", "arrow-button")?;
    // inline SVG arrow instead of loading an image
    arrow_left.set_inner_html(ARROW_LEFT_SVG);
    arrow_container.append_child(&arrow_left)?;

    // right arrow button
    let arrow_right = document.create_element("button")?;
    arrow_right.set_id("arrow-right");
    arrow_right.set_attribute("class", "arrow-button")?;
    arrow_right.set_inner_html(ARROW_RIGHT_SVG);
    arrow_container.append_child(&arrow_right)?;

    controlshud.append_child(&arrow_container)?;

    // fullscreen button
    let fs_button = document.create_element("button")?;
    fs_button.set_id("fullscreen-button");
    fs_button.set_attribute("class", "fullscreen-button")?;
    fs_button.set_inner_html(FULLSCREEN_SVG);
    controlshud.append_child(&fs_button)?;

    // range slider
    // div-based slider for consistent styling/behavior across browsers.
    // structure: <div #myRange .slider> <div .slider-track/> <div #slider-thumb .slider-thumb/> </div>
    // pointer events are wired in setup_event_listeners.
    let slider = document.create_element("div")?;
    slider.set_id("myRange");
    slider.set_attribute("class", "slider")?;
    let track = document.create_element("div")?;
    track.set_attribute("class", "slider-track")?;
    slider.append_child(&track)?;
    let thumb = document.create_element("div")?;
    thumb.set_id("slider-thumb");
    thumb.set_attribute("class", "slider-thumb")?;
    // start at index 0 (today) -> thumb at right edge
    thumb.dyn_ref::<web_sys::HtmlElement>().unwrap()
        .style().set_property("left", "100%")?;
    slider.append_child(&thumb)?;
    controlshud.append_child(&slider)?;

    body.append_child(&controlshud)?;

    // elevation legend
    // attached directly to body. previously wrapped in an in-flow #infohud
    // flex container, but toggling that between flex/none caused the canvas's
    // ResizeObserver to refire and altered screen_width between frames on
    // mobile, making 1-finger touch rotation feel slower once the legend
    // was hidden. the legend is position: absolute so a wrapper isn't needed.
    let legend = create_legend(document)?;
    legend.set_id("legend");
    body.append_child(&legend)?;

    // wire up event listeners
    setup_event_listeners(document)?;

    Ok(())
}

fn create_legend(document: &web_sys::Document) -> Result<web_sys::Element, JsValue> {
    let legend = document.create_element("div")?;
    legend.set_attribute("class", "legend")?;

    let legend_title = document.create_element("div")?;
    legend_title.set_attribute("class", "legend-title")?;
    legend_title.set_text_content(Some("Elevation"));
    legend.append_child(&legend_title)?;

    let legend_scale = document.create_element("div")?;
    legend_scale.set_attribute("class", "legend-scale")?;

    let ul = document.create_element("ul")?;
    ul.set_attribute("class", "legend-labels")?;

    // same 13 elevation bands as the Three.js version
    let bands: [(&str, &str); 13] = [
        ("#eeeeee", "5km+"),
        ("#b6b5b5", "3.2km to 5km"),
        ("#977944", "2km to 3.2km"),
        ("#805411", "1km to 2km"),
        ("#3d3704", "400m to 1km"),
        ("#00530b", "150m to 400m"),
        ("#347a2a", "75m to 150m"),
        ("#4fa642", "0m to 75m"),
        ("#5778b3", "-50m to 0m"),
        ("#344b75", "-150m to -50m"),
        ("#2a3c63", "-3km to -150m"),
        ("#1f2d47", "-6km to -3km"),
        ("#080e30", "-11km to -6km"),
    ];

    for (color, label) in &bands {
        let li = document.create_element("li")?;
        let span = document.create_element("span")?;
        span.dyn_ref::<web_sys::HtmlElement>().unwrap()
            .style().set_property("background", color)?;
        li.append_child(&span)?;
        // text node after the span
        let text = document.create_text_node(label);
        li.append_child(&text)?;
        ul.append_child(&li)?;
    }

    legend_scale.append_child(&ul)?;
    legend.append_child(&legend_scale)?;

    Ok(legend)
}

fn create_links(document: &web_sys::Document) -> Result<web_sys::Element, JsValue> {
    let links_div = document.create_element("div")?;
    links_div.set_id("links");

    let ul = document.create_element("ul")?;

    let entries: [(&str, &str); 2] = [
        ("https://github.com/afnleaf/paleomap3D", "repo"),
        ("https://github.com/afnleaf/paleomap3D?tab=readme-ov-file#credits", "credits"),
    ];

    for (href, text) in &entries {
        let li = document.create_element("li")?;
        let a = document.create_element("a")?;
        a.set_attribute("href", href)?;
        a.set_attribute("target", "_blank")?;
        a.set_attribute("rel", "noopener noreferrer")?;
        a.set_text_content(Some(text));
        li.append_child(&a)?;
        ul.append_child(&li)?;
    }

    links_div.append_child(&ul)?;
    Ok(links_div)
}


// EVENT LISTENERS ------------------------------------------------------------

fn setup_event_listeners(document: &web_sys::Document) -> Result<(), JsValue> {
    // slider input -> update shared atomic so Bevy picks it up
    // pointer events unify mouse/touch/pen. move + up listen on window so
    // the drag survives the cursor leaving the slider hitbox.
    let slider = document.get_element_by_id("myRange").unwrap();
    let window = web_sys::window().unwrap();

    let on_pointer_down = Closure::<dyn FnMut(Event)>::new(|event: Event| {
        event.prevent_default();
        let me: web_sys::MouseEvent = event.dyn_into().unwrap();
        DRAGGING.store(true, Ordering::Relaxed);
        // visual: dragging class swaps thumb fill -> outline (matches old :active style)
        if let Some(s) = doc().get_element_by_id("myRange") {
            s.set_attribute("class", "slider dragging").ok();
        }
        update_index_from_client_x(me.client_x() as f64);
    });
    slider.add_event_listener_with_callback(
        "pointerdown",
        on_pointer_down.as_ref().unchecked_ref()
    )?;
    on_pointer_down.forget();

    let on_pointer_move = Closure::<dyn FnMut(Event)>::new(|event: Event| {
        if !DRAGGING.load(Ordering::Relaxed) { return; }
        let me: web_sys::MouseEvent = event.dyn_into().unwrap();
        update_index_from_client_x(me.client_x() as f64);
    });
    window.add_event_listener_with_callback(
        "pointermove",
        on_pointer_move.as_ref().unchecked_ref()
    )?;
    on_pointer_move.forget();

    let on_pointer_end = Closure::<dyn FnMut(Event)>::new(|_event: Event| {
        if !DRAGGING.swap(false, Ordering::Relaxed) { return; }
        if let Some(s) = doc().get_element_by_id("myRange") {
            s.set_attribute("class", "slider").ok();
        }
    });
    // pointerup ends the drag normally; pointercancel handles touch interruptions
    // (e.g. system gesture, OS notification). same handler for both.
    window.add_event_listener_with_callback(
        "pointerup",
        on_pointer_end.as_ref().unchecked_ref()
    )?;
    window.add_event_listener_with_callback(
        "pointercancel",
        on_pointer_end.as_ref().unchecked_ref()
    )?;
    on_pointer_end.forget();

    // left arrow button -> go back in time (increase index)
    let arrow_left = document.get_element_by_id("arrow-left").unwrap();
    let on_left_click = Closure::<dyn FnMut(Event)>::new(|_event: Event| {
        let current = DOM_DISPLAYED_INDEX.load(Ordering::Relaxed);
        let new_index = (current + 1).min(108);
        DOM_DISPLAYED_INDEX.store(new_index, Ordering::Relaxed);
        DOM_MAP_INDEX.store(new_index, Ordering::Relaxed);
        set_thumb_position(&doc(), new_index);
    });
    arrow_left.add_event_listener_with_callback(
        "click",
        on_left_click.as_ref().unchecked_ref()
    )?;
    on_left_click.forget();

    // right arrow button -> go forward in time (decrease index)
    let arrow_right = document.get_element_by_id("arrow-right").unwrap();
    let on_right_click = Closure::<dyn FnMut(Event)>::new(|_event: Event| {
        let current = DOM_DISPLAYED_INDEX.load(Ordering::Relaxed);
        let new_index = (current - 1).max(0);
        DOM_DISPLAYED_INDEX.store(new_index, Ordering::Relaxed);
        DOM_MAP_INDEX.store(new_index, Ordering::Relaxed);
        set_thumb_position(&doc(), new_index);
    });
    arrow_right.add_event_listener_with_callback(
        "click",
        on_right_click.as_ref().unchecked_ref()
    )?;
    on_right_click.forget();

    // fullscreen toggle -> hide/show infohud
    let fs_button = document.get_element_by_id("fullscreen-button").unwrap();
    let on_fs_click = Closure::<dyn FnMut(Event)>::new(|_event: Event| {
        let document = doc();
        let current = DOM_FULLSCREEN.load(Ordering::Relaxed);
        let new_state = if current == 0 { 1 } else { 0 };
        DOM_FULLSCREEN.store(new_state, Ordering::Relaxed);

        // toggle legend visibility
        if let Some(legend) = document.get_element_by_id("legend") {
            let el: web_sys::HtmlElement = legend.dyn_into().unwrap();
            el.style().set_property("display",
                if new_state == 1 { "none" } else { "block" }
            ).ok();
        }
        // swap the fullscreen icon
        if let Some(btn) = document.get_element_by_id("fullscreen-button") {
            btn.set_inner_html(
                if new_state == 1 { FULLSCREEN_EXIT_SVG } else { FULLSCREEN_SVG }
            );
        }
    });
    fs_button.add_event_listener_with_callback(
        "click",
        on_fs_click.as_ref().unchecked_ref()
    )?;
    on_fs_click.forget();

    Ok(())
}

// called from Bevy systems when CurrentMap changes (e.g. from keyboard)
// updates the DOM slider position and title text
pub fn sync_dom_to_map_index(index: usize) {
    let document = doc();

    // update slider
    DOM_DISPLAYED_INDEX.store(index as i32, Ordering::Relaxed);
    set_thumb_position(&document, index as i32);

    // update title
    if let Some(title) = document.get_element_by_id("title") {
        title.set_inner_html(&mapnames::get_map_title_html(index));
    }
}

// pointer x in viewport coords -> map index, then update both atomics + thumb.
// left edge of slider = oldest (index 108), right edge = today (index 0).
fn update_index_from_client_x(client_x: f64) {
    let document = doc();
    let slider = match document.get_element_by_id("myRange") {
        Some(s) => s,
        None => return,
    };
    let rect = slider.get_bounding_client_rect();
    let width = rect.width();
    if width <= 0.0 { return; }
    let pct = ((client_x - rect.left()) / width).clamp(0.0, 1.0);
    let index = ((1.0 - pct) * 108.0).round() as i32;
    DOM_MAP_INDEX.store(index, Ordering::Relaxed);
    DOM_DISPLAYED_INDEX.store(index, Ordering::Relaxed);
    set_thumb_position(&document, index);
}

// thumb is positioned by `left: X%`; transform: translate(-50%, -50%) centers it.
fn set_thumb_position(document: &web_sys::Document, index: i32) {
    if let Some(thumb) = document.get_element_by_id("slider-thumb") {
        let el: web_sys::HtmlElement = thumb.dyn_into().unwrap();
        let pct = (108.0 - index as f64) / 108.0 * 100.0;
        el.style().set_property("left", &format!("{}%", pct)).ok();
    }
}


// INLINE SVGs ----------------------------------------------------------------
// so we don't have to load external image files

const ARROW_LEFT_SVG: &str = r#"<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>"#;

const ARROW_RIGHT_SVG: &str = r#"<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>"#;

const FULLSCREEN_SVG: &str = r#"<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>"#;

const FULLSCREEN_EXIT_SVG: &str = r#"<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>"#;
