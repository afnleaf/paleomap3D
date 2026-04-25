document.addEventListener("DOMContentLoaded", () => {
  // elevation legend ------------------------------------------------------- /
  const ELEVATION_BANDS = [
    "#eeeeee", // 5 km+
    "#b6b5b5", // 3.2 km to 5 km
    "#977944", // 2 km to 3.2 km
    "#805411", // 1 km to 2 km
    "#3d3704", // 400 m to 1 km
    "#00530b", // 150 m to 400 m
    "#347a2a", // 75 m to 150 m
    "#4fa642", // 0 m to 75 m
    "#5778b3", // -50 m to 0 m
    "#344b75", // -150 m to -50 m
    "#2a3c63", // -3 km to -150 m
    "#1f2d47", // -6 km to -3 km
    "#080e30", // -11 km to -6 km
  ];

  // boundary labels for the elevation strip: the lower edge of each band, in
  // order from highest to lowest. position i is at percentage (i+1) / length.
  // length matches ELEVATION_BANDS so swatch boundaries align with these ticks.
  const TICK_LABELS = [
    "5 km", "3.2 km", "2 km", "1 km", "400 m", "150 m", "75 m", "0 m",
    "-50 m", "-150 m", "-3 km", "-6 km", "-11 km",
  ];

  // map name table --------------------------------------------------------- /
  // ported from frontend/public/maps.js; previously also lived in
  // wasm_modules/src/mapnames.rs, but since JS is the only consumer now
  // the table lives here only. [era, age] per index, 0 = present-day,
  // 108 = Cambrian/Precambrian boundary.
  const MAP_NAMES = [
    ["Present-day",                    "Holocene, 0 Ma"],
    ["Early Pliocene",                 "Zanclean, 4.47 Ma"],
    ["Middle/Late Miocene",            "Serravallian&Tortonian, 10.5 Ma"],
    ["Middle Miocene",                 "Langhian, 14.9 Ma"],
    ["Early Miocene",                  "Aquitanian&Burdigalian, 19.5 Ma"],
    ["Late Oligocene",                 "Chattian, 25.6 Ma"],
    ["Early Oligocene",                "Rupelian, 31 Ma"],
    ["Late Eocene",                    "Priabonian, 35.9 Ma"],
    ["Late Middle Eocene",             "Bartonian, 39.5 Ma"],
    ["Early Middle Eocene",            "Lutetian, 44.5 Ma"],
    ["Early Eocene",                   "Ypresian, 51.9 Ma"],
    ["Paleocene/Eocene Boundary",      "PETM, 56 Ma"],
    ["Paleocene",                      "Danian & Thanetian, 61 Ma"],
    ["KT Boundary",                    "Latest Maastrichtian, 66 Ma"],
    ["Late Cretaceous",                "Maastrichtian, 69 Ma"],
    ["Late Cretaceous",                "Late Campanian, 75 Ma"],
    ["Late Cretaceous",                "Early Campanian, 80.8 Ma"],
    ["Late Cretaceous",                "Santonian&Coniacian, 86.7 Ma"],
    ["Mid-Cretaceous",                 "Turonian, 91.9 Ma"],
    ["Mid-Cretaceous",                 "Cenomanian, 97.2 Ma"],
    ["Early Cretaceous",               "Late Albian, 102.6 Ma"],
    ["Early Cretaceous",               "Middle Albian, 107 Ma"],
    ["Early Cretaceous",               "Early Albian, 111 Ma"],
    ["Early Cretaceous",               "Late Aptian, 115.8 Ma"],
    ["Early Cretaceous",               "Early Aptian, 121.8 Ma"],
    ["Early Cretaceous",               "Barremian, 127.2 Ma"],
    ["Early Cretaceous",               "Hauterivian, 131.2 Ma"],
    ["Early Cretaceous",               "Valanginian, 136.4 Ma"],
    ["Early Cretaceous",               "Berriasian, 142.4 Ma"],
    ["Jurassic/Cretaceous Boundary",   "145 Ma"],
    ["Late Jurassic",                  "Tithonian, 148.6 Ma"],
    ["Late Jurassic",                  "Kimmeridgian, 154.7 Ma"],
    ["Late Jurassic",                  "Oxfordian, 160.4 Ma"],
    ["Middle Jurassic",                "Callovian, 164.8 Ma"],
    ["Middle Jurassic",                "Bajocian&Bathonian, 168.2 Ma"],
    ["Middle Jurassic",                "Aalenian, 172.2 Ma"],
    ["Early Jurassic",                 "Toarcian, 178.4 Ma"],
    ["Early Jurassic",                 "Pliensbachian, 186.8 Ma"],
    ["Early Jurassic",                 "Sinemurian/Pliensbachian, 190.8 Ma"],
    ["Early Jurassic",                 "Hettangian&Sinemurian, 196 Ma"],
    ["Late Triassic",                  "Rhaetian/Hettangian, 201.3 Ma"],
    ["Late Triassic",                  "Rhaetian, 204.9 Ma"],
    ["Late Triassic",                  "Late Norian, 213.2 Ma"],
    ["Late Triassic",                  "Mid Norian, 217.8 Ma"],
    ["Late Triassic",                  "Early Norian, 222.4 Ma"],
    ["Late Triassic",                  "Carnian/Norian, 227 Ma"],
    ["Late Triassic",                  "Carnian, 232 Ma"],
    ["Late Triassic",                  "Early Carnian, 233.6 Ma"],
    ["Middle Triassic",                "Ladinian, 239.5 Ma"],
    ["Middle Triassic",                "Anisian, 244.6 Ma"],
    ["Permo-Triassic Boundary",        "252 Ma"],
    ["Late Permian",                   "Lopingian, 256 Ma"],
    ["Late Middle Permian",            "Capitanian, 262.5 Ma"],
    ["Middle Permian",                 "Wordian/Capitanian Boundary, 265.1 Ma"],
    ["Middle Permian",                 "Roadian&Wordian, 268.7 Ma"],
    ["Early Permian",                  "Late Kungurian, 275 Ma"],
    ["Early Permian",                  "Early Kungurian, 280 Ma"],
    ["Early Permian",                  "Artinskian, 286.8 Ma"],
    ["Early Permian",                  "Sakmarian, 292.6 Ma"],
    ["Early Permian",                  "Asselian, 297 Ma"],
    ["Late Pennsylvanian",             "Gzhelian, 301.3 Ma"],
    ["Late Pennsylvanian",             "Kasimovian, 305.4 Ma"],
    ["Middle Pennsylvanian",           "Moscovian, 311.1 Ma"],
    ["Early/Middle Carboniferous",     "Baskirian/Moscovian boundary, 314.6 Ma"],
    ["Early Pennsylvanian",            "Bashkirian, 319.2 Ma"],
    ["Late Mississippian",             "Serpukhovian, 327 Ma"],
    ["Late Mississippian",             "Visean/Serpukhovian boundary, 330.9 Ma"],
    ["Middle Mississippian",           "Late Visean, 333 Ma"],
    ["Middle Mississippian",           "Middle Visean, 338.8 Ma"],
    ["Middle Mississippian",           "Early Visean, 344 Ma"],
    ["Early Mississippian",            "Late Tournaisian, 349 Ma"],
    ["Early Mississippian",            "Early Tournaisian, 354 Ma"],
    ["Devono-Carboniferous Boundary",  "358.9 Ma"],
    ["Late Devonian",                  "Middle Famennian, 365.6 Ma"],
    ["Late Devonian",                  "Early Famennian, 370 Ma"],
    ["Late Devonian",                  "Late Frasnian, 375 Ma"],
    ["Late Devonian",                  "Early Frasnian, 380 Ma"],
    ["Middle Devonian",                "Givetian, 385.2 Ma"],
    ["Middle Devonian",                "Eifelian, 390.5 Ma"],
    ["Early Devonian",                 "Late Emsian, 395 Ma"],
    ["Early Devonian",                 "Middle Emsian, 400 Ma"],
    ["Early Devonian",                 "Early Emsian, 405 Ma"],
    ["Early Devonian",                 "Pragian, 409.2 Ma"],
    ["Early Devonian",                 "Lochkovian, 415 Ma"],
    ["Late Silurian",                  "Pridoli, 421.1 Ma"],
    ["Late Silurian",                  "Ludlow, 425.2 Ma"],
    ["Middle Silurian",                "Wenlock, 430.4 Ma"],
    ["Early Silurian",                 "Late Llandovery, 436 Ma"],
    ["Early Silurian",                 "Early Llandovery, 441.2 Ma"],
    ["Late Ordovician",                "Hirnantian, 444.5 Ma"],
    ["Late Ordovician",                "Katian, 449.1 Ma"],
    ["Late Ordovician",                "Sandbian, 455.7 Ma"],
    ["Middle Ordovician",              "Late Darwillian, 460 Ma"],
    ["Middle Ordovician",              "Early Darwillian, 465 Ma"],
    ["Early Ordovician",               "Floian/Dapingian boundary, 470 Ma"],
    ["Early Ordovician",               "Late Early Floian, 475 Ma"],
    ["Early Ordovician",               "Tremadoc, 481.6 Ma"],
    ["Cambro-Ordovician Boundary",     "485.4 Ma"],
    ["Late Cambrian",                  "Jiangshanian, 491.8 Ma"],
    ["Late Cambrian",                  "Pabian, 495.5 Ma"],
    ["Late Middle Cambrian",           "Guzhangian, 498.8 Ma"],
    ["Late Middle Cambrian",           "Early Epoch 3, 505 Ma"],
    ["Early Middle Cambrian",          "Late Epoch 2, 510 Ma"],
    ["Early Middle Cambrian",          "Middle Epoch 2, 515 Ma"],
    ["Early/Middle Cambrian boundary", "520 Ma"],
    ["Early Cambrian",                 "Late Terreneuvian, 525 Ma"],
    ["Early Cambrian",                 "Middle Terreneuvian, 530 Ma"],
    ["Early Cambrian",                 "Early Terreneuvian, 535 Ma"],
    ["Cambrian/Precambrian boundary",  "541 Ma"],
  ];

  // slider tick rendering --------------------------------------------------- /
  const MAP_MAX_IDX = 108;
  const pctFromIdx = i => (MAP_MAX_IDX - i) / MAP_MAX_IDX * 100;

  /* labels at era boundaries */
  const BOUNDARIES = [
    { idx: 0,   name: "Present" },
    { idx: 13,  name: "K/Pg" },
    { idx: 29,  name: "J/K" },
    { idx: 40,  name: "T/J" },
    { idx: 50,  name: "P/T" },
    { idx: 72,  name: "D/C" },
    { idx: 97,  name: "O/Cm" },
    { idx: 108, name: "-" },
  ];

  const ticklabels  = document.getElementById("ticklabels");
  const tickAnchor  = document.getElementById("track-wrap");

  // for each visible boundary we inject two siblings: a .tick-mark (white
  // vertical line inside the track) and a .tick-label (text below the track).
  // both share the same left% so they stay vertically aligned on resize.
  BOUNDARIES.forEach(b => {
    if (b.name === "-" || b.name === "Present") return;
    const pct = pctFromIdx(b.idx) + "%";

    if (ticklabels) {
      const l = document.createElement("div");
      l.className = "tick-label";
      l.style.left = pct;
      l.textContent = b.name;
      ticklabels.appendChild(l);
    }
    if (tickAnchor) {
      const tm = document.createElement("div");
      tm.className = "tick-mark";
      tm.style.left = pct;
      tickAnchor.appendChild(tm);
    }
  });

  // slider pointer/drag/arrow handlers -------------------------------------- /
  // JS owns all HUD DOM mutation. two CustomEvents on window bridge to Bevy;
  // both carry just the integer index as detail:
  //   "paleomap3d:map-changed" (Rust -> JS): Bevy's CurrentMap changed
  //   "paleomap3d:set-index"   (JS -> Rust): user moved the slider
  const trackWrap    = document.getElementById("track-wrap");
  const slider       = document.getElementById("slider");
  const thumb        = document.getElementById("thumb");
  const prevBtn      = document.getElementById("prev");
  const nextBtn      = document.getElementById("next");
  const titleEra     = document.querySelector("#title .title-era");
  const titleAge     = document.querySelector("#title .title-age");
  const infoEra      = document.querySelector("#panel-info .info-era");
  const infoAge      = document.querySelector("#panel-info .info-age");

  let displayedIdx = 0;
  let dragging = false;
  // top-tray active tab index. hoisted so paintHud can refresh the viewport
  // height when the info panel's content (era/age) changes; setActiveTab
  // (defined further below in the top-sheet block) writes it.
  let currentTab = 0;

  // full HUD paint from just an index (thumb position, arrow disabled
  // state, title era/age, info panel era/age). called on drag, arrow click,
  // and on the map-changed event from Rust.
  const paintHud = idx => {
    displayedIdx = idx;
    if (thumb)   thumb.style.left = pctFromIdx(idx) + "%";
    if (prevBtn) prevBtn.toggleAttribute("disabled", idx >= MAP_MAX_IDX);
    if (nextBtn) nextBtn.toggleAttribute("disabled", idx === 0);
    const [era, age] = MAP_NAMES[idx] || ["", ""];
    if (titleEra) titleEra.textContent = era;
    if (titleAge) titleAge.textContent = "(" + age + ")";
    if (infoEra) infoEra.textContent = era;
    if (infoAge) infoAge.textContent = age;
    // info panel content can change height (era names wrap differently across
    // indices); when it's the active tab, retune the viewport so the closed
    // offset stays accurate. tabPanels/tabViewport are declared lower in this
    // closure but initialized by the time the first map-changed event fires.
    if (currentTab === 1 && tabPanels && tabViewport) {
      const active = tabPanels.children[1];
      if (active) tabViewport.style.height = active.offsetHeight + "px";
    }
  };

  // ask Bevy to move to a given index. we optimistically paint the HUD
  // so the UI feels responsive instead of waiting for the Bevy round-trip.
  const requestIndex = idx => {
    const clamped = Math.max(0, Math.min(MAP_MAX_IDX, idx|0));
    window.dispatchEvent(new CustomEvent("paleomap3d:set-index", { detail: clamped }));
    paintHud(clamped);
  };

  // pointer x in viewport coords -> map index.
  // left edge of track = oldest (108), right edge = today (0).
  const indexFromClientX = clientX => {
    const rect = trackWrap.getBoundingClientRect();
    if (rect.width <= 0) return displayedIdx;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round((1 - pct) * MAP_MAX_IDX);
  };

  if (trackWrap) {
    // pointer events unify mouse/touch/pen. move+up listen on window so
    // the drag survives the cursor leaving the slider hitbox.
    trackWrap.addEventListener("pointerdown", e => {
      e.preventDefault();
      dragging = true;
      if (slider) slider.classList.add("dragging");
      requestIndex(indexFromClientX(e.clientX));
    });
    window.addEventListener("pointermove", e => {
      if (!dragging) return;
      requestIndex(indexFromClientX(e.clientX));
    });
    // pointerup ends the drag normally; pointercancel handles touch interruptions
    // (e.g. system gesture, OS notification).
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      if (slider) slider.classList.remove("dragging");
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  }

  // speed presets shared by all three step-cadences: chevron hold-repeat,
  // playback tick, and (via the set-speed bridge) Bevy's KeyRepeatTimer for
  // keyboard arrow repeat. 1× = 100ms; faster reads smoother because
  // individual frame swaps stop being resolvable.
  const SPEED_PRESETS = [
    { label: "0.5×", ms: 200 },
    { label: "1×",   ms: 100 },
    { label: "2×",   ms: 50  },
    { label: "4×",   ms: 25  },
  ];
  let speedIdx = 1;

  // JS -> Rust bridge sibling to paleomap3d:set-index. pushes the current
  // preset ms so Bevy can retune KeyRepeatTimer; the Rust listener clamps.
  const dispatchSpeed = () => {
    window.dispatchEvent(new CustomEvent("paleomap3d:set-speed", {
      detail: SPEED_PRESETS[speedIdx].ms,
    }));
  };

  // prev = older (higher index), next = newer (lower index).
  // press-and-hold advances at the current SPEED_PRESETS[speedIdx] cadence,
  // captured at pointerdown so mid-hold speed-cycle doesn't interrupt the
  // running interval. pattern: one step immediately on pointerdown, then
  // setInterval fires until pointerup/cancel or the button goes disabled.
  const attachHoldRepeat = (btn, delta) => {
    if (!btn) return;
    let interval = null;
    const stop = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };
    btn.addEventListener("pointerdown", e => {
      if (btn.disabled) return;
      e.preventDefault();
      // pointer capture so pointerup fires on the button even if the finger
      // slides off its hitbox mid-hold, without it a small slip on touch
      // would strand the interval running forever.
      btn.setPointerCapture(e.pointerId);
      requestIndex(displayedIdx + delta);
      interval = setInterval(() => {
        if (btn.disabled) { stop(); return; }
        requestIndex(displayedIdx + delta);
      }, SPEED_PRESETS[speedIdx].ms);
    });
    btn.addEventListener("pointerup", stop);
    btn.addEventListener("pointercancel", stop);
  };
  attachHoldRepeat(prevBtn, +1);
  attachHoldRepeat(nextBtn, -1);

  // playback ---------------------------------------------------------------- /
  // play/pause drives a setInterval that calls the same requestIndex() the
  // slider uses, so Bevy sees identical input whether the user dragged,
  // pressed an arrow tip, or hit play.
  // direction default = +1 (toward past, index increases). on hitting an
  // endpoint we flip direction AND auto-pause: one round-trip per play press,
  // and the next press resumes in the opposite direction without a manual flip.
  // SPEED_PRESETS is shared with the chevron hold-repeat above.
  const playPauseBtn = document.getElementById("playpause");
  const directionBtn = document.getElementById("direction");
  const speedBtn     = document.getElementById("speed");

  const PLAY_SVG   = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>';
  const PAUSE_SVG  = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>';
  const REWIND_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,6 12,18 4,12" fill="currentColor"/><polygon points="20,6 20,18 12,12" fill="currentColor"/></svg>';
  const FFWD_SVG   = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,6 12,18 20,12" fill="currentColor"/><polygon points="4,6 4,18 12,12" fill="currentColor"/></svg>';

  let playDirection = +1;
  let playTimer = null;

  const updatePlayLabel = () => {
    if (!playPauseBtn) return;
    playPauseBtn.innerHTML = playTimer ? PAUSE_SVG : PLAY_SVG;
    playPauseBtn.setAttribute("aria-label", playTimer ? "Pause" : "Play");
    playPauseBtn.classList.toggle("active", !!playTimer);
  };
  const updateDirectionLabel = () => {
    if (!directionBtn) return;
    directionBtn.innerHTML = playDirection > 0 ? REWIND_SVG : FFWD_SVG;
    directionBtn.setAttribute("aria-label", playDirection > 0 ? "Toward past" : "Toward present");
  };
  const updateSpeedLabel = () => {
    if (!speedBtn) return;
    speedBtn.textContent = SPEED_PRESETS[speedIdx].label;
  };

  const playbackTick = () => {
    requestIndex(displayedIdx + playDirection);
    // landed on an endpoint after stepping: flip direction so the next
    // play press goes the other way, then auto-pause.
    if ((playDirection > 0 && displayedIdx >= MAP_MAX_IDX) ||
        (playDirection < 0 && displayedIdx <= 0)) {
      playDirection = -playDirection;
      updateDirectionLabel();
      stopPlayback();
    }
  };

  const stopPlayback = () => {
    if (!playTimer) return;
    clearInterval(playTimer);
    playTimer = null;
    updatePlayLabel();
  };
  const startPlayback = () => {
    if (playTimer) return;
    // sitting on the endpoint our direction would push past (e.g. at idx 0
    // with direction = -1): flip first so the first tick actually moves
    // instead of pausing immediately on the post-tick endpoint check.
    if (playDirection > 0 && displayedIdx >= MAP_MAX_IDX) {
      playDirection = -1;
      updateDirectionLabel();
    } else if (playDirection < 0 && displayedIdx <= 0) {
      playDirection = +1;
      updateDirectionLabel();
    }
    playTimer = setInterval(playbackTick, SPEED_PRESETS[speedIdx].ms);
    updatePlayLabel();
  };

  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
      if (playTimer) stopPlayback(); else startPlayback();
    });
  }
  if (directionBtn) {
    directionBtn.addEventListener("click", () => {
      playDirection = -playDirection;
      updateDirectionLabel();
    });
  }
  if (speedBtn) {
    speedBtn.addEventListener("click", () => {
      speedIdx = (speedIdx + 1) % SPEED_PRESETS.length;
      updateSpeedLabel();
      dispatchSpeed();
      // restart the timer at the new cadence if we're mid-playback;
      // otherwise the new speed is picked up on the next play press.
      if (playTimer) {
        clearInterval(playTimer);
        playTimer = setInterval(playbackTick, SPEED_PRESETS[speedIdx].ms);
      }
    });
  }
  updatePlayLabel();
  updateDirectionLabel();
  updateSpeedLabel();

  // sheet open/close ------------------------------------------------------- /
  // pointer-driven drag on the handle. tap (no movement, short press) toggles;
  // drag follows the finger between fully-open (offset 0) and fully-closed
  // (offset = chrome height + .hud-bottom padding-bottom, so chrome clears
  // the viewport edge); release snaps to whichever half the offset is in.
  // we drag the handle, not the chrome, because the chrome already has its
  // own slider pointer-listeners that would fight us.
  const sheet       = document.getElementById("sheet");
  const sheetHandle = document.getElementById("sheet-handle");
  const chromeEl    = document.querySelector(".timeline-chrome");
  const hudBottom   = document.querySelector(".hud-bottom");

  let sheetClosed = false;
  let dragStartY = 0;
  let dragStartOffset = 0;
  let dragOffset = 0;
  let dragMoved = false;
  let dragStartTime = 0;

  const closedOffsetPx = () => {
    if (!chromeEl || !hudBottom) return 0;
    const padBottom = parseFloat(getComputedStyle(hudBottom).paddingBottom) || 0;
    return chromeEl.offsetHeight + padBottom;
  };
  const setSheetY = px => {
    if (sheet) sheet.style.setProperty("--sheet-y", px + "px");
  };
  const snapTo = closed => {
    sheetClosed = closed;
    setSheetY(closed ? closedOffsetPx() : 0);
  };

  if (sheet && sheetHandle) {
    sheetHandle.addEventListener("pointerdown", e => {
      e.preventDefault();
      // capture so move/up still fire if the finger drifts off the handle
      sheetHandle.setPointerCapture(e.pointerId);
      dragStartY = e.clientY;
      dragStartOffset = sheetClosed ? closedOffsetPx() : 0;
      dragOffset = dragStartOffset;
      dragMoved = false;
      dragStartTime = performance.now();
      sheet.classList.add("dragging");
    });
    sheetHandle.addEventListener("pointermove", e => {
      if (!sheetHandle.hasPointerCapture(e.pointerId)) return;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dy) > 3) dragMoved = true;
      const max = closedOffsetPx();
      dragOffset = Math.max(0, Math.min(max, dragStartOffset + dy));
      setSheetY(dragOffset);
    });
    const endDrag = e => {
      if (!sheetHandle.hasPointerCapture(e.pointerId)) return;
      sheetHandle.releasePointerCapture(e.pointerId);
      sheet.classList.remove("dragging");
      const dt = performance.now() - dragStartTime;
      // unmoved short press = tap, toggle; otherwise snap to nearest half
      if (!dragMoved && dt < 400) { snapTo(!sheetClosed); return; }
      snapTo(dragOffset > closedOffsetPx() / 2);
    };
    sheetHandle.addEventListener("pointerup", endDrag);
    sheetHandle.addEventListener("pointercancel", endDrag);

    // resize/orientation: chrome reflows (esp. mobile wrap), recompute so
    // the closed offset still lands chrome exactly off-screen
    window.addEventListener("resize", () => {
      if (sheetClosed) setSheetY(closedOffsetPx());
    });
  }

  // top sheet open/close --------------------------------------------------- /
  // mirror of the bottom-sheet handler; closed offset is negative so the
  // sheet slides up off-screen and the handle ends flush with viewport top.
  // dragOffset is clamped to [closedOffset, 0] and snap tests against
  // closedOffset/2 (which is itself negative).
  const sheetTop        = document.getElementById("sheet-top");
  const sheetHandleTop  = document.getElementById("sheet-handle-top");
  const topContent      = document.getElementById("top-content");
  const hudTop          = document.querySelector(".hud-top");
  const panelElevation  = document.getElementById("panel-elevation");
  const tabBar          = document.getElementById("tab-bar");
  const tabViewport     = document.getElementById("tab-viewport");
  const tabPanels       = document.getElementById("tab-panels");
  const tabBtns         = tabBar ? Array.from(tabBar.querySelectorAll(".tab-btn")) : [];
  const TAB_COUNT       = tabBtns.length;

  let sheetTopClosed = true;
  let dragTopStartY = 0;
  let dragTopStartOffset = 0;
  let dragTopOffset = 0;
  let dragTopMoved = false;
  let dragTopStartTime = 0;

  const closedOffsetTopPx = () => {
    if (!topContent || !hudTop) return 0;
    const padTop = parseFloat(getComputedStyle(hudTop).paddingTop) || 0;
    return -(topContent.offsetHeight + padTop);
  };
  const setSheetTopY = px => {
    if (sheetTop) sheetTop.style.setProperty("--sheet-y", px + "px");
  };
  const snapTopTo = closed => {
    sheetTopClosed = closed;
    setSheetTopY(closed ? closedOffsetTopPx() : 0);
  };

  if (sheetTop && sheetHandleTop) {
    // populate legend before computing the initial closed offset so the
    // sheet retracts by exactly the legend's measured height. strip + tick
    // row append into panel-elevation (the first tab panel); both stagger
    // sub-rows are always rendered, and CSS overlaps them on desktop / stacks
    // them on mobile.
    if (panelElevation) {
      const strip = document.createElement("div");
      strip.className = "legend-strip";
      ELEVATION_BANDS.forEach(color => {
        const sw = document.createElement("span");
        sw.className = "legend-swatch";
        sw.style.background = color;
        strip.appendChild(sw);
      });
      panelElevation.appendChild(strip);

      const tickRow = document.createElement("div");
      tickRow.className = "legend-tick-row";
      const stagA = document.createElement("div");
      stagA.className = "legend-tick-stagger-a";
      const stagB = document.createElement("div");
      stagB.className = "legend-tick-stagger-b";
      tickRow.appendChild(stagA);
      tickRow.appendChild(stagB);
      // alternate ticks between rows so each row has ~half the labels at ~2x
      // spacing on mobile; on desktop they overlap into a single visual row.
      TICK_LABELS.forEach((label, i) => {
        const tick = document.createElement("span");
        tick.className = "legend-tick";
        tick.style.left = ((i + 1) / TICK_LABELS.length * 100) + "%";
        tick.textContent = label;
        (i % 2 === 0 ? stagA : stagB).appendChild(tick);
      });
      panelElevation.appendChild(tickRow);
    }

    // tab carousel ---------------------------------------------------------- /
    // tabs change which panel is exposed by translating .tab-panels in 100%
    // increments. activation paths: click a tab button, or horizontal swipe
    // inside the viewport. viewport height tracks the active panel so the
    // closed-sheet offset retracts by exactly the right amount per tab.
    // currentTab itself is declared at outer scope so paintHud can read it.

    const setActiveTab = idx => {
      currentTab = Math.max(0, Math.min(TAB_COUNT - 1, idx | 0));
      if (tabPanels) tabPanels.style.transform = "translateX(" + (-currentTab * 100) + "%)";
      tabBtns.forEach((b, i) => {
        b.classList.toggle("active", i === currentTab);
        b.setAttribute("aria-selected", i === currentTab ? "true" : "false");
      });
      const active = tabPanels && tabPanels.children[currentTab];
      if (active && tabViewport) tabViewport.style.height = active.offsetHeight + "px";
      // re-snap to the new closed offset so reopening from this tab lands
      // chrome exactly at viewport edge instead of leaking the previous tab's
      // height through.
      if (sheetTopClosed) setSheetTopY(closedOffsetTopPx());
    };

    tabBtns.forEach((b, i) => b.addEventListener("click", () => setActiveTab(i)));

    // pointer-driven horizontal swipe. axis is locked on the first ~6px of
    // motion, vertical drags are ignored so they don't fight the sheet handle
    // (which lives outside the viewport anyway). during the drag we follow
    // the finger 1:1 by composing the base translateX with the live dx.
    let swipeActive = false;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeAxis   = null;
    let swipeDx     = 0;

    if (tabViewport && tabPanels) {
      tabViewport.addEventListener("pointerdown", e => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        tabViewport.setPointerCapture(e.pointerId);
        swipeActive = true;
        swipeStartX = e.clientX;
        swipeStartY = e.clientY;
        swipeAxis   = null;
        swipeDx     = 0;
      });
      tabViewport.addEventListener("pointermove", e => {
        if (!swipeActive) return;
        const dx = e.clientX - swipeStartX;
        const dy = e.clientY - swipeStartY;
        if (swipeAxis === null) {
          if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
          swipeAxis = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
          if (swipeAxis === "h") tabPanels.classList.add("dragging");
        }
        if (swipeAxis !== "h") return;
        // elastic resistance past the first/last tab so the user feels the
        // boundary instead of dragging into empty viewport space.
        const overshoot = (currentTab === 0 && dx > 0) ||
                          (currentTab === TAB_COUNT - 1 && dx < 0);
        swipeDx = overshoot ? dx * 0.25 : dx;
        tabPanels.style.transform =
          "translateX(calc(" + (-currentTab * 100) + "% + " + swipeDx + "px))";
      });
      const endSwipe = e => {
        if (!swipeActive) return;
        swipeActive = false;
        if (tabViewport.hasPointerCapture(e.pointerId)) {
          tabViewport.releasePointerCapture(e.pointerId);
        }
        tabPanels.classList.remove("dragging");
        if (swipeAxis !== "h") return;
        // snap if past 20% of viewport width or 50px, whichever is greater
        const w = tabViewport.offsetWidth;
        const threshold = Math.max(50, w * 0.2);
        let target = currentTab;
        if (swipeDx < -threshold) target = currentTab + 1;
        else if (swipeDx > threshold) target = currentTab - 1;
        setActiveTab(target);
      };
      tabViewport.addEventListener("pointerup", endSwipe);
      tabViewport.addEventListener("pointercancel", endSwipe);
    }

    // resize: panel content can reflow (legend stagger stack on mobile etc),
    // so re-measure the active panel on resize so the viewport tracks it.
    // registered before the sheet's own resize listener so closedOffsetTopPx()
    // there reads the post-resize topContent height.
    window.addEventListener("resize", () => {
      const active = tabPanels && tabPanels.children[currentTab];
      if (active && tabViewport) tabViewport.style.height = active.offsetHeight + "px";
    });

    sheetHandleTop.addEventListener("pointerdown", e => {
      e.preventDefault();
      sheetHandleTop.setPointerCapture(e.pointerId);
      dragTopStartY = e.clientY;
      dragTopStartOffset = sheetTopClosed ? closedOffsetTopPx() : 0;
      dragTopOffset = dragTopStartOffset;
      dragTopMoved = false;
      dragTopStartTime = performance.now();
      sheetTop.classList.add("dragging");
    });
    sheetHandleTop.addEventListener("pointermove", e => {
      if (!sheetHandleTop.hasPointerCapture(e.pointerId)) return;
      const dy = e.clientY - dragTopStartY;
      if (Math.abs(dy) > 3) dragTopMoved = true;
      const min = closedOffsetTopPx();
      dragTopOffset = Math.max(min, Math.min(0, dragTopStartOffset + dy));
      setSheetTopY(dragTopOffset);
    });
    const endDragTop = e => {
      if (!sheetHandleTop.hasPointerCapture(e.pointerId)) return;
      sheetHandleTop.releasePointerCapture(e.pointerId);
      sheetTop.classList.remove("dragging");
      const dt = performance.now() - dragTopStartTime;
      if (!dragTopMoved && dt < 400) { snapTopTo(!sheetTopClosed); return; }
      // 25% commit threshold from either start state: a small flick
      // dismisses (or opens), past that and we snap back to start.
      const closed = closedOffsetTopPx();
      const flipPoint = sheetTopClosed ? closed * 0.75 : closed * 0.25;
      snapTopTo(dragTopOffset < flipPoint);
    };
    sheetHandleTop.addEventListener("pointerup", endDragTop);
    sheetHandleTop.addEventListener("pointercancel", endDragTop);

    window.addEventListener("resize", () => {
      if (sheetTopClosed) setSheetTopY(closedOffsetTopPx());
    });

    // start closed without animating in: borrow .dragging to skip the
    // transition for one frame, then drop it so user-initiated snaps animate.
    // setActiveTab paints transforms + viewport height + (since the sheet is
    // closed) the closed-offset, all under .dragging so none of it transitions.
    sheetTop.classList.add("dragging");
    setActiveTab(0);
    requestAnimationFrame(() => sheetTop.classList.remove("dragging"));
  }

  // repaint when Bevy (or Rust-side keyboard handler) says CurrentMap changed.
  // first firing doubles as the "wasm is ready" signal: wasm init calls
  // notify_map_changed(0) right after installing its set-speed listener, so
  // pushing speed here guarantees Rust gets it even though DOMContentLoaded
  // ran before the listener was in place.
  let initialSpeedPushed = false;
  window.addEventListener("paleomap3d:map-changed", e => {
    if (typeof e.detail !== "number") return;
    paintHud(e.detail);
    if (!initialSpeedPushed) {
      initialSpeedPushed = true;
      dispatchSpeed();
    }
  });
});
