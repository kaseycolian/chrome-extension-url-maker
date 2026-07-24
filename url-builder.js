// Pure URL-building logic. No chrome/DOM dependencies so it is unit-testable.

export function normalizeBaseUrl(base) {
  return base.replace(/\/+$/, "") + "/";
}

export function normalizeRoute(route) {
  return route.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function buildTokenPart(token) {
  return "&token=" + token;
}

export function buildUrl(base, route, token) {
  return normalizeBaseUrl(base) + normalizeRoute(route) + buildTokenPart(token);
}
