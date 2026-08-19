import { buildUrl } from "./url-builder.js";
import { addEntry, removeEntry, getLabel, findEntry } from "./history-list.js";
import { dissectUrl } from "./url-dissect.js";

const els = {
  baseUrl: document.getElementById("base-url"),
  baseUrlName: document.getElementById("base-url-name"),
  baseUrlHist: document.getElementById("base-url-hist"),
  baseUrlDropdown: document.getElementById("base-url-dropdown"),
  route: document.getElementById("route"),
  routeName: document.getElementById("route-name"),
  routeHist: document.getElementById("route-hist"),
  routeDropdown: document.getElementById("route-dropdown"),
  paramsList: document.getElementById("params-list"),
  addParamBtn: document.getElementById("add-param-btn"),
  paramsName: document.getElementById("params-name"),
  saveParamsBtn: document.getElementById("save-params-btn"),
  paramsHist: document.getElementById("params-hist"),
  paramsDropdown: document.getElementById("params-dropdown"),
  getCurrentBtn: document.getElementById("get-current-btn"),
  getCurrentNotice: document.getElementById("get-current-notice"),
  createBtn: document.getElementById("create-btn"),
  createGoBtn: document.getElementById("create-go-btn"),
  result: document.getElementById("result"),
  resultUrl: document.getElementById("result-url"),
};

// In-memory copies of the saved lists, loaded from storage on open.
let baseUrlHistory = [];
let routeHistory = [];
let params = []; // live editable query-parameter rows: { key, value, enabled }
let paramSnapshots = []; // saved param sets for the dropdown: { key, name, params }

// A short "key1, key2" preview of a saved param set.
function summarizeParams(list) {
  if (!list || list.length === 0) return "empty set";
  return list.map((p) => p.key || "(blank)").join(", ");
}

// Describes each searchable field so the same code drives all dropdowns.
const SECTIONS = {
  base: {
    keyField: "url",
    valueEl: els.baseUrl,
    nameEl: els.baseUrlName,
    dropdownEl: els.baseUrlDropdown,
    getList: () => baseUrlHistory,
    setList: (list) => {
      baseUrlHistory = list;
      chrome.storage.local.set({ baseUrlHistory: list });
    },
    labelFor: (e) => getLabel(e, "url"),
    secondaryFor: (e) => (e.name && e.name.trim() !== "" ? e.url : ""),
    onPick: (e) => pickEntry(SECTIONS.base, e),
    onDelete: (e) => deleteEntry(SECTIONS.base, e),
  },
  route: {
    keyField: "route",
    valueEl: els.route,
    nameEl: els.routeName,
    dropdownEl: els.routeDropdown,
    getList: () => routeHistory,
    setList: (list) => {
      routeHistory = list;
      chrome.storage.local.set({ routeHistory: list });
    },
    labelFor: (e) => getLabel(e, "route"),
    secondaryFor: (e) => (e.name && e.name.trim() !== "" ? e.route : ""),
    onPick: (e) => pickEntry(SECTIONS.route, e),
    onDelete: (e) => deleteEntry(SECTIONS.route, e),
  },
  params: {
    dropdownEl: els.paramsDropdown,
    getList: () => paramSnapshots,
    labelFor: (e) =>
      e.name && e.name.trim() !== "" ? e.name : summarizeParams(e.params),
    secondaryFor: (e) =>
      e.name && e.name.trim() !== "" ? summarizeParams(e.params) : "",
    onPick: (e) => pickSnapshot(e),
    onDelete: (e) => deleteSnapshot(e),
  },
};

// --- Load persisted state ---
const STORAGE_KEYS = [
  "base-url",
  "base-url-name",
  "route",
  "route-name",
  "token", // legacy single-token value, migrated below
  "params",
  "paramSnapshots",
  "baseUrlHistory",
  "routeHistory",
];

chrome.storage.local.get(STORAGE_KEYS, (saved) => {
  els.baseUrl.value = saved["base-url"] || "";
  els.baseUrlName.value = saved["base-url-name"] || "";
  els.route.value = saved["route"] || "";
  els.routeName.value = saved["route-name"] || "";
  baseUrlHistory = saved.baseUrlHistory || [];
  routeHistory = saved.routeHistory || [];
  paramSnapshots = saved.paramSnapshots || [];

  if (Array.isArray(saved.params)) {
    params = saved.params; // present (even []) — respect it
  } else {
    // First run, or an upgrade from the single-Token version: seed one token row.
    params = [{ key: "token", value: saved.token || "", enabled: true, masked: true }];
    chrome.storage.local.set({ params });
    if (saved.token !== undefined) chrome.storage.local.remove("token");
  }
  renderParams();
});

// --- Persist live field values on input ---
function persistLive(key, el) {
  el.addEventListener("input", () =>
    chrome.storage.local.set({ [key]: el.value })
  );
}
persistLive("base-url", els.baseUrl);
persistLive("base-url-name", els.baseUrlName);
persistLive("route", els.route);
persistLive("route-name", els.routeName);

// --- Query-parameter rows ---
function persistParams() {
  chrome.storage.local.set({ params });
}

function renderParams() {
  els.paramsList.replaceChildren();

  params.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "param-row" + (p.enabled ? "" : " off");

    const enabled = document.createElement("input");
    enabled.type = "checkbox";
    enabled.className = "param-enabled";
    enabled.checked = p.enabled;
    enabled.title = "Enable / disable this parameter";
    enabled.setAttribute("aria-label", "Enable or disable this parameter");
    enabled.addEventListener("change", () => {
      params[i].enabled = enabled.checked;
      row.classList.toggle("off", !enabled.checked);
      persistParams();
    });

    const key = document.createElement("input");
    key.type = "text";
    key.className = "param-key";
    key.placeholder = "key";
    key.value = p.key;
    key.autocomplete = "off";
    key.spellcheck = false;
    key.addEventListener("input", () => {
      params[i].key = key.value;
      persistParams();
    });

    const isMasked = p.masked !== false; // default masked unless explicitly false
    const value = document.createElement("input");
    value.type = isMasked ? "password" : "text";
    value.className = "param-value";
    value.placeholder = "value";
    value.value = p.value;
    value.autocomplete = "off";
    value.spellcheck = false;
    value.addEventListener("input", () => {
      params[i].value = value.value;
      persistParams();
    });

    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "reveal" + (isMasked ? " masked" : "");
    reveal.textContent = "👁";
    reveal.title = "Show / hide value";
    reveal.setAttribute("aria-label", "Show or hide value");
    reveal.addEventListener("click", () => {
      value.type = value.type === "password" ? "text" : "password";
      params[i].masked = value.type === "password";
      reveal.classList.toggle("masked", value.type === "password");
      persistParams();
    });

    // Click-to-peek: shows the full value in a tooltip for long values.
    const tip = document.createElement("div");
    tip.className = "value-tip";
    tip.hidden = true;
    tip.addEventListener("click", (e) => e.stopPropagation());

    const magnify = document.createElement("button");
    magnify.type = "button";
    magnify.className = "magnify";
    magnify.textContent = "🔍";
    magnify.title = "Show full value";
    magnify.setAttribute("aria-label", "Show full value");
    magnify.addEventListener("click", (e) => {
      e.stopPropagation();
      const willShow = tip.hidden;
      closeAllValueTips();
      if (willShow) {
        tip.textContent = value.value === "" ? "(empty)" : value.value;
        tip.hidden = false;
      }
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "del";
    del.textContent = "×";
    del.title = "Delete parameter";
    del.setAttribute("aria-label", "Delete parameter");
    del.addEventListener("click", () => {
      params.splice(i, 1);
      persistParams();
      renderParams();
    });

    row.append(enabled, key, value, reveal, magnify, del, tip);
    els.paramsList.appendChild(row);
  });
}

// Hide every open "show full value" tooltip.
function closeAllValueTips() {
  els.paramsList
    .querySelectorAll(".value-tip")
    .forEach((t) => (t.hidden = true));
}

// A click anywhere else dismisses open value tooltips (the magnify/tip clicks
// stop propagation, so opening one doesn't immediately close it).
document.addEventListener("click", closeAllValueTips);

els.addParamBtn.addEventListener("click", () => {
  params.push({ key: "", value: "", enabled: true, masked: false });
  persistParams();
  renderParams();
});

els.saveParamsBtn.addEventListener("click", () => {
  const name = els.paramsName.value.trim();
  const snapshot = {
    name,
    params: params.map((p) => ({ ...p })),
    key: name || JSON.stringify(params),
  };
  paramSnapshots = addEntry(paramSnapshots, snapshot, "key");
  chrome.storage.local.set({ paramSnapshots });
  if (!els.paramsDropdown.hidden) renderDropdown(SECTIONS.params);
});

function pickSnapshot(entry) {
  params = entry.params.map((p) => ({ ...p }));
  els.paramsName.value = entry.name || "";
  persistParams();
  renderParams();
  closeAllDropdowns();
}

function deleteSnapshot(entry) {
  paramSnapshots = removeEntry(paramSnapshots, entry.key, "key");
  chrome.storage.local.set({ paramSnapshots });
  renderDropdown(SECTIONS.params); // keep panel open, reflecting the change
}

// --- Dropdown rendering & interaction ---
function renderDropdown(section) {
  const { dropdownEl } = section;
  const list = section.getList();
  dropdownEl.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "saved-empty";
    empty.textContent = "No saved entries yet.";
    dropdownEl.appendChild(empty);
    return;
  }

  for (const entry of list) {
    const row = document.createElement("div");
    row.className = "row";

    const text = document.createElement("div");
    text.className = "row-text";

    const primary = document.createElement("div");
    primary.className = "row-primary";
    primary.textContent = section.labelFor(entry);
    text.appendChild(primary);

    const secondaryText = section.secondaryFor(entry);
    if (secondaryText) {
      const secondary = document.createElement("div");
      secondary.className = "row-secondary";
      secondary.textContent = secondaryText;
      text.appendChild(secondary);
    }

    text.addEventListener("click", () => section.onPick(entry));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "del";
    del.textContent = "×";
    del.setAttribute("aria-label", "Delete entry");
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      section.onDelete(entry);
    });

    row.appendChild(text);
    row.appendChild(del);
    dropdownEl.appendChild(row);
  }
}

function closeAllDropdowns() {
  els.baseUrlDropdown.hidden = true;
  els.routeDropdown.hidden = true;
  els.paramsDropdown.hidden = true;
}

function toggleDropdown(section) {
  const willOpen = section.dropdownEl.hidden;
  closeAllDropdowns();
  if (willOpen) {
    renderDropdown(section);
    section.dropdownEl.hidden = false;
  }
}

function pickEntry(section, entry) {
  section.valueEl.value = entry[section.keyField];
  section.nameEl.value = entry.name || "";
  chrome.storage.local.set({
    [section.valueEl.id]: section.valueEl.value,
    [section.nameEl.id]: section.nameEl.value,
  });
  closeAllDropdowns();
}

function deleteEntry(section, entry) {
  const next = removeEntry(section.getList(), entry[section.keyField], section.keyField);
  section.setList(next);
  renderDropdown(section); // keep panel open, reflecting the change
}

els.baseUrlHist.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDropdown(SECTIONS.base);
});
els.routeHist.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDropdown(SECTIONS.route);
});
els.paramsHist.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleDropdown(SECTIONS.params);
});

// Close dropdowns when clicking anywhere outside an open panel.
document.addEventListener("click", (e) => {
  if (!e.target.closest(".saved-panel") && !e.target.closest(".hist-btn")) {
    closeAllDropdowns();
  }
});

// --- Save on build ---
function saveCurrentToHistory() {
  if (els.baseUrl.value !== "") {
    SECTIONS.base.setList(
      addEntry(
        baseUrlHistory,
        { url: els.baseUrl.value, name: els.baseUrlName.value },
        "url"
      )
    );
  }
  if (els.route.value !== "") {
    SECTIONS.route.setList(
      addEntry(
        routeHistory,
        { route: els.route.value, name: els.routeName.value },
        "route"
      )
    );
  }
}

function createUrl() {
  saveCurrentToHistory();
  const url = buildUrl(els.baseUrl.value, els.route.value, params);
  els.resultUrl.textContent = url;
  els.result.hidden = false;
  return url;
}

els.getCurrentBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0] && tabs[0].url;
    const parts = url ? dissectUrl(url) : null;
    if (!parts) {
      els.getCurrentNotice.textContent = "Couldn't read this tab's URL.";
      els.getCurrentNotice.hidden = false;
      return;
    }
    els.baseUrl.value = parts.baseUrl;
    els.route.value = parts.route;

    // Carry the saved name for an already-known value; otherwise clear it.
    const baseMatch = findEntry(baseUrlHistory, parts.baseUrl, "url");
    const routeMatch = findEntry(routeHistory, parts.route, "route");
    els.baseUrlName.value = baseMatch ? baseMatch.name : "";
    els.routeName.value = routeMatch ? routeMatch.name : "";

    // Merge the tab's query params into the editor: update+enable a matching
    // key, or append a new enabled row. Existing rows are otherwise kept.
    for (const incoming of parts.params) {
      const existing = params.find((p) => p.key === incoming.key);
      if (existing) {
        existing.value = incoming.value;
        existing.enabled = true;
      } else {
        params.push({ ...incoming, masked: false });
      }
    }
    persistParams();
    renderParams();

    chrome.storage.local.set({
      "base-url": parts.baseUrl,
      route: parts.route,
      "base-url-name": els.baseUrlName.value,
      "route-name": els.routeName.value,
    });
    els.getCurrentNotice.hidden = true;
  });
});

els.createBtn.addEventListener("click", () => {
  createUrl();
});

els.createGoBtn.addEventListener("click", () => {
  const url = createUrl();
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url });
    }
  });
});
