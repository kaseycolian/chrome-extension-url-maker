import { buildUrl } from "./url-builder.js";
import { addEntry, removeEntry, getLabel } from "./history-list.js";

const els = {
  baseUrl: document.getElementById("base-url"),
  baseUrlName: document.getElementById("base-url-name"),
  baseUrlHist: document.getElementById("base-url-hist"),
  baseUrlDropdown: document.getElementById("base-url-dropdown"),
  route: document.getElementById("route"),
  routeName: document.getElementById("route-name"),
  routeHist: document.getElementById("route-hist"),
  routeDropdown: document.getElementById("route-dropdown"),
  token: document.getElementById("token"),
  createBtn: document.getElementById("create-btn"),
  createGoBtn: document.getElementById("create-go-btn"),
  result: document.getElementById("result"),
  resultUrl: document.getElementById("result-url"),
};

// In-memory copies of the saved lists, loaded from storage on open.
let baseUrlHistory = [];
let routeHistory = [];

// Describes each searchable field so the same code drives both lists.
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
  },
};

// --- Load persisted state ---
const STORAGE_KEYS = [
  "base-url",
  "base-url-name",
  "route",
  "route-name",
  "token",
  "baseUrlHistory",
  "routeHistory",
];

chrome.storage.local.get(STORAGE_KEYS, (saved) => {
  els.baseUrl.value = saved["base-url"] || "";
  els.baseUrlName.value = saved["base-url-name"] || "";
  els.route.value = saved["route"] || "";
  els.routeName.value = saved["route-name"] || "";
  els.token.value = saved["token"] || "";
  baseUrlHistory = saved.baseUrlHistory || [];
  routeHistory = saved.routeHistory || [];
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
persistLive("token", els.token);

// --- Dropdown rendering & interaction ---
function renderDropdown(section) {
  const { keyField, dropdownEl } = section;
  const list = section.getList();
  dropdownEl.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "dropdown-empty";
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
    primary.textContent = getLabel(entry, keyField);
    text.appendChild(primary);

    const hasName = entry.name && entry.name.trim() !== "";
    if (hasName) {
      const secondary = document.createElement("div");
      secondary.className = "row-secondary";
      secondary.textContent = entry[keyField];
      text.appendChild(secondary);
    }

    text.addEventListener("click", () => pickEntry(section, entry));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "del";
    del.textContent = "×"; // ×
    del.setAttribute("aria-label", "Delete entry");
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteEntry(section, entry);
    });

    row.appendChild(text);
    row.appendChild(del);
    dropdownEl.appendChild(row);
  }
}

function closeAllDropdowns() {
  els.baseUrlDropdown.hidden = true;
  els.routeDropdown.hidden = true;
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

// Close dropdowns when clicking anywhere outside an open panel.
document.addEventListener("click", (e) => {
  if (!e.target.closest(".dropdown") && !e.target.closest(".hist-btn")) {
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
  const url = buildUrl(els.baseUrl.value, els.route.value, els.token.value);
  els.resultUrl.textContent = url;
  els.result.hidden = false;
  return url;
}

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
