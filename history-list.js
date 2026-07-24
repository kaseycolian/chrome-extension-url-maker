// Pure list operations for saved Base URL / Route entries.
// Entries are objects keyed by `keyField` ("url" or "route") plus a `name`.

export function addEntry(list, entry, keyField) {
  const key = entry[keyField];
  const filtered = list.filter((e) => e[keyField] !== key);
  return [{ ...entry }, ...filtered];
}

export function removeEntry(list, keyValue, keyField) {
  return list.filter((e) => e[keyField] !== keyValue);
}

export function getLabel(entry, keyField) {
  return entry.name && entry.name.trim() !== "" ? entry.name : entry[keyField];
}

export function findEntry(list, keyValue, keyField) {
  return list.find((e) => e[keyField] === keyValue);
}
