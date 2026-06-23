import { buildUrl } from "./url-builder.js";

const FIELDS = ["base-url", "route", "token"];

const els = {
  baseUrl: document.getElementById("base-url"),
  route: document.getElementById("route"),
  token: document.getElementById("token"),
  createBtn: document.getElementById("create-btn"),
  createGoBtn: document.getElementById("create-go-btn"),
  result: document.getElementById("result"),
  resultUrl: document.getElementById("result-url"),
};

// Restore saved values on open.
chrome.storage.local.get(FIELDS, (saved) => {
  els.baseUrl.value = saved["base-url"] || "";
  els.route.value = saved["route"] || "";
  els.token.value = saved["token"] || "";
});

// Persist each field on input.
els.baseUrl.addEventListener("input", () =>
  chrome.storage.local.set({ "base-url": els.baseUrl.value })
);
els.route.addEventListener("input", () =>
  chrome.storage.local.set({ route: els.route.value })
);
els.token.addEventListener("input", () =>
  chrome.storage.local.set({ token: els.token.value })
);

function createUrl() {
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
