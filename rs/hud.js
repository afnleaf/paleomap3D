document.addEventListener("DOMContentLoaded", () => {
  const ELEVATION_BANDS = [
    ["#eeeeee", "5 km+"],
    ["#b6b5b5", "3.2 km to 5 km"],
    ["#977944", "2 km to 3.2 km"],
    ["#805411", "1 km to 2 km"],
    ["#3d3704", "400 m to 1 km"],
    ["#00530b", "150 m to 400 m"],
    ["#347a2a", "75 m to 150 m"],
    ["#4fa642", "0 m to 75 m"],
    ["#5778b3", "-50 m to 0 m"],
    ["#344b75", "-150 m to -50 m"],
    ["#2a3c63", "-3 km to -150 m"],
    ["#1f2d47", "-6 km to -3 km"],
    ["#080e30", "-11 km to -6 km"],
  ];

  const legendList = document.getElementById("legend-list");
  ELEVATION_BANDS.forEach(([color, label]) => {
    const li = document.createElement("li");
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = color;
    li.appendChild(sw);
    li.appendChild(document.createTextNode(label));
    legendList.appendChild(li);
  });

  /* -- rail ↔ panel wiring ------------------------------------------------ */
  const DESKTOP_Q = window.matchMedia("(min-width: 600px)");
  const isPanelOpen = p => {
    if (p.dataset.state === "open")   return true;
    if (p.dataset.state === "closed") return false;
    return DESKTOP_Q.matches;
  };
  const setPanelOpen = (p, open) => {
    p.dataset.state = open ? "open" : "closed";
    document.querySelectorAll(`[data-panel-toggle="${p.id}"]`)
      .forEach(btn => btn.setAttribute("aria-expanded", open ? "true" : "false"));
  };

  document.querySelectorAll("[data-panel-toggle]").forEach(btn => {
    const panel = document.getElementById(btn.dataset.panelToggle);
    if (!panel) return;
    // sync aria with CSS default so screen readers aren't told "expanded" when hidden
    btn.setAttribute("aria-expanded", isPanelOpen(panel) ? "true" : "false");
    btn.addEventListener("click", () => setPanelOpen(panel, !isPanelOpen(panel)));
  });
  document.querySelectorAll("[data-panel-close]").forEach(btn => {
    const panel = document.getElementById(btn.dataset.panelClose);
    if (panel) btn.addEventListener("click", () => setPanelOpen(panel, false));
  });
  // keep aria-expanded honest if viewport crosses the breakpoint
  DESKTOP_Q.addEventListener("change", () => {
    document.querySelectorAll("[data-panel-toggle]").forEach(btn => {
      const panel = document.getElementById(btn.dataset.panelToggle);
      if (panel) btn.setAttribute("aria-expanded", isPanelOpen(panel) ? "true" : "false");
    });
  });

});
