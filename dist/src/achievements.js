import { FAMILIES } from "./bank.js";

export const COMPLETION_TOTAL = FAMILIES.length;
export const EVIDENCE_LIMIT = 1000;
const ids = new Set(FAMILIES.map((f) => f.id));
const blank = () => ({ version: 1, families: [], seen: [], saturated: false });
// Identity ignores seed/index and guided/independent presentation of the same
// conditions. Thus switching codes or levels cannot re-award a shown solution.
export function conditionKey(question) {
  if (question?.bankVersion !== 2 || !ids.has(question.family) || !question.params ||
      ![1, 2, 3, 4].includes(question.level)) return null;
  const key = question.family + "|" + (question.level <= 2 ? 2 : 4) + "|" + JSON.stringify(question.params);
  return key.length <= 1024 ? key : null;
}
function validSeen(key) {
  if (typeof key !== "string" || key.length > 1024) return false;
  const [family, level, ...payload] = key.split("|");
  if (!ids.has(family) || !["2", "4"].includes(level)) return false;
  try {
    const params = JSON.parse(payload.join("|"));
    return !!params && typeof params === "object" && !Array.isArray(params);
  } catch { return false; }
}
export function loadAchievements(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.families) ||
      !Array.isArray(value.seen) || typeof value.saturated !== "boolean" ||
      value.families.length > COMPLETION_TOTAL || value.seen.length > EVIDENCE_LIMIT ||
      value.families.some((id) => !ids.has(id)) ||
      value.seen.some((id) => !validSeen(id)) ||
      new Set(value.families).size !== value.families.length ||
      new Set(value.seen).size !== value.seen.length) return blank();
  return { version: 1, families: [...value.families], seen: [...value.seen], saturated: value.saturated };
}
export function recordAttempt(value, question, { correct = false, aided = false, review = false } = {}) {
  const next = loadAchievements(value);
  const key = conditionKey(question);
  if (!key) return next;
  const seen = next.seen.includes(key);
  if (!seen && !next.saturated && next.seen.length < EVIDENCE_LIMIT &&
      correct && !aided && !review && [2, 4].includes(question.level) &&
      !next.families.includes(question.family)) next.families.push(question.family);
  if (!seen) {
    if (next.seen.length < EVIDENCE_LIMIT) next.seen.push(key);
    else next.saturated = true;
  }
  return next;
}
