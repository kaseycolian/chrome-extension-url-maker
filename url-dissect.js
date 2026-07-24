// Splits a full URL into { baseUrl, route }, dropping any token query param.
// Returns null when the input is not a parseable URL.

export function dissectUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const baseUrl = url.origin + "/";
  const path = url.pathname.replace(/^\//, "");

  const params = url.searchParams;
  for (const key of [...params.keys()]) {
    if (key.toLowerCase() === "token") params.delete(key);
  }
  const query = params.toString();

  const route = path + (query ? "?" + query : "") + url.hash;
  return { baseUrl, route };
}
