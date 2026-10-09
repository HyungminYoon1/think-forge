export const PROGRESS_KEY = "web-lab-progress-v1";
export const REPO_IDS = Object.freeze([
  "data-mirage", "echo-vault", "light-route", "logic-foundry", "neon-tactics",
  "orbit-courier", "packet-journey", "parcel-panic", "pixel-kitchen", "pocket-city",
  "route-race", "sense-lab", "swarm-garden", "think-forge", "traffic-lab",
]);
const OWN_ID = "think-forge";
const MAX_BYTES = 8192;
const object = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const keysAre = (x, expected) => Object.keys(x).length === expected.length && expected.every((k) => Object.hasOwn(x, k));
export function validProgress(value) {
  if (!object(value) || !keysAre(value, ["version", "apps"]) || value.version !== 1 ||
      !object(value.apps) || Object.keys(value.apps).length > REPO_IDS.length) return false;
  return Object.entries(value.apps).every(([id, item]) =>
    REPO_IDS.includes(id) && object(item) && keysAre(item, ["completed", "total", "updatedAt"]) &&
    Number.isInteger(item.completed) && Number.isInteger(item.total) &&
    item.completed >= 0 && item.completed <= item.total && item.total <= 1000 &&
    typeof item.updatedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(item.updatedAt) &&
    Number.isFinite(Date.parse(item.updatedAt)) && new Date(item.updatedAt).toISOString() === item.updatedAt);
}
function read(storage) {
  const raw = storage.getItem(PROGRESS_KEY);
  if (raw === null) return { version: 1, apps: {} };
  if (typeof raw !== "string" || raw.length > MAX_BYTES) return null;
  const value = JSON.parse(raw);
  return validProgress(value) ? value : null;
}
// Storage boundary: call only after private evidence was saved successfully.
export function reportProgress(completed, total, storage, now = new Date()) {
  try {
    storage ??= localStorage;
    const value = read(storage);
    if (!value || completed <= 0) return false;
    const previous = value.apps[OWN_ID];
    if (previous?.completed === completed && previous?.total === total) return true;
    value.apps[OWN_ID] = { completed, total, updatedAt: now.toISOString() };
    if (!validProgress(value)) return false;
    const encoded = JSON.stringify(value);
    if (encoded.length > MAX_BYTES) return false;
    storage.setItem(PROGRESS_KEY, encoded);
    return true;
  } catch { return false; }
}
export function clearProgress(storage) {
  try {
    storage ??= localStorage;
    const value = read(storage);
    if (!value) return false;
    if (!Object.hasOwn(value.apps, OWN_ID)) return true;
    delete value.apps[OWN_ID];
    storage.setItem(PROGRESS_KEY, JSON.stringify(value));
    return true;
  } catch { return false; }
}
