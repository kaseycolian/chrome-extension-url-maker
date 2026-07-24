// Splits a full URL into { baseUrl, route, params }.
// `route` is the path plus any hash; every query param is surfaced in `params`
// as an enabled { key, value } row. Returns null when the input is not a
// parseable URL.

export function dissectUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const baseUrl = url.origin + "/";
  const path = url.pathname.replace(/^\//, "");
  const route = path + url.hash;

  const params = [...url.searchParams.entries()].map(([key, value]) => ({
    key,
    value,
    enabled: true,
  }));

  return { baseUrl, route, params };
}
