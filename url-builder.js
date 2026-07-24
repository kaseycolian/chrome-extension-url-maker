// Pure URL-building logic. No chrome/DOM dependencies so it is unit-testable.

export function normalizeBaseUrl(base) {
  return base.replace(/\/+$/, "") + "/";
}

export function normalizeRoute(route) {
  return route.replace(/^\/+/, "").replace(/\/+$/, "");
}

// Turns the param rows into a `key=value&key2=value2` string. Only enabled rows
// with a non-blank key are included; values are used verbatim (not encoded).
export function buildQueryString(params) {
  return params
    .filter((p) => p.enabled && p.key.trim() !== "")
    .map((p) => `${p.key}=${p.value}`)
    .join("&");
}

export function buildUrl(base, route, params) {
  const start = normalizeBaseUrl(base) + normalizeRoute(route);
  const qs = buildQueryString(params);
  if (qs === "") return start;
  return start + (start.includes("?") ? "&" : "?") + qs;
}
