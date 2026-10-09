import test from "node:test";
import assert from "node:assert/strict";
import { PROGRESS_KEY, REPO_IDS, validProgress, reportProgress, clearProgress } from "../dist/src/progress.js";
import { COMPLETION_TOTAL, EVIDENCE_LIMIT, conditionKey, loadAchievements, recordAttempt } from "../dist/src/achievements.js";
import { FAMILIES, makeFamilyQuestion } from "../dist/src/bank.js";

const stamp = "2026-10-09T00:00:00.000Z";
const entry = (completed = 1) => ({ completed, total: 48, updatedAt: stamp });
function storage(raw = null) {
  const data = new Map(raw === null ? [] : [[PROGRESS_KEY, raw]]);
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test("summary is a bounded allowlisted aggregate; preserve all 14 siblings and only clear own entry", () => {
  assert.equal(REPO_IDS.length, 15);
  const apps = Object.fromEntries(REPO_IDS.filter((id) => id !== "think-forge").map((id) => [id, entry()]));
  const s = storage(JSON.stringify({ version: 1, apps }));
  assert.equal(reportProgress(3, 48, s, new Date(stamp)), true);
  const value = JSON.parse(s.getItem(PROGRESS_KEY));
  assert.deepEqual(value.apps["think-forge"], { ...entry(3) });
  for (const [id, item] of Object.entries(apps)) assert.deepEqual(value.apps[id], item);
  assert.equal(Object.keys(value.apps).length, 15);
  const original = s.getItem(PROGRESS_KEY);
  reportProgress(3, 48, s, new Date("2026-10-10T00:00:00.000Z"));
  assert.equal(s.getItem(PROGRESS_KEY), original, "same completion must not fabricate an updated date");
  assert.equal(clearProgress(s), true);
  assert.deepEqual(JSON.parse(s.getItem(PROGRESS_KEY)), { version: 1, apps });
  clearProgress(s);
  assert.deepEqual(JSON.parse(s.getItem(PROGRESS_KEY)), { version: 1, apps });
});
test("summary rejects private/unknown/oversized/malformed records and fails without replacing storage", () => {
  for (const raw of [
    "{", "[]", "null", " ".repeat(8193),
    JSON.stringify({ version: 2, apps: {} }),
    JSON.stringify({ version: 1, apps: { unknown: entry() } }),
    JSON.stringify({ version: 1, apps: { "think-forge": { ...entry(), seed: "smoke" } } }),
    JSON.stringify({ version: 1, apps: { "think-forge": { ...entry(), updatedAt: "2026-02-30T00:00:00.000Z" } } }),
  ]) {
    const s = storage(raw);
    assert.equal(reportProgress(1, 48, s), false);
    assert.equal(clearProgress(s), false);
    assert.equal(s.getItem(PROGRESS_KEY), raw);
  }
  for (const [completed, total] of [[-1, 48], [49, 48], [1.5, 48], [1, 1001], [NaN, 48], [1, Infinity], [1, -1], [0, 48]]) {
    const s = storage();
    assert.equal(reportProgress(completed, total, s), false);
    assert.equal(s.getItem(PROGRESS_KEY), null);
  }
  assert.equal(validProgress({ version: 1, apps: {} }), true);
  const denied = { getItem() { throw Error("denied"); } };
  assert.equal(reportProgress(1, 48, denied), false);
  assert.equal(clearProgress(denied), false);
  const full = { getItem: () => null, setItem() { throw Error("quota"); } };
  assert.equal(reportProgress(1, 48, full), false);
});
test("actual first independent correct attempts count distinct families, never views, hints, review or repeated conditions", () => {
  assert.equal(COMPLETION_TOTAL, 48);
  let evidence = loadAchievements(null);
  assert.equal(evidence.families.length, 0);
  for (const family of FAMILIES) {
    const q = makeFamilyQuestion(family.id, 4, "completion");
    evidence = recordAttempt(evidence, q, { correct: true });
    evidence = recordAttempt(evidence, q, { correct: true });
  }
  assert.equal(evidence.families.length, 48);
  assert.equal(evidence.seen.length, 48);
  for (const options of [{ aided: true, correct: true }, { review: true, correct: true }, { correct: false }]) {
    const q = makeFamilyQuestion("composition", 4, "trial");
    const failed = recordAttempt(null, q, options);
    assert.equal(failed.families.length, 0);
    assert.equal(recordAttempt(failed, { ...q, seed: "other-code", index: 999 }, { correct: true }).families.length, 0);
  }
  const guided = makeFamilyQuestion("composition", 3, "guided");
  const seen = recordAttempt(null, guided, { correct: true });
  assert.equal(seen.families.length, 0);
  assert.equal(conditionKey(guided), conditionKey({ ...guided, level: 4 }));
  assert.equal(recordAttempt(seen, { ...guided, level: 4 }, { correct: true }).families.length, 0);
  const legacy = { ...guided, bankVersion: 1 };
  assert.deepEqual(recordAttempt(null, legacy, { correct: true }), loadAchievements(null));
  const first = makeFamilyQuestion("crt", 2, "second");
  assert.equal(recordAttempt(null, first, { correct: true }).families.length, 1);
});
test("evidence is durable, validates IDs, retains bounded history without FIFO re-awards", () => {
  const q = makeFamilyQuestion("crt", 4, "ledger");
  const saved = recordAttempt(null, q, { aided: true });
  assert.deepEqual(loadAchievements(JSON.parse(JSON.stringify(saved))), saved);
  const full = { version: 1, families: [], seen: Array.from({ length: EVIDENCE_LIMIT }, (_, n) => "crt|4|" + JSON.stringify({ n })), saturated: false };
  const next = recordAttempt(full, q, { correct: true });
  assert.equal(next.families.length, 0);
  assert.equal(next.seen.length, EVIDENCE_LIMIT);
  assert.equal(next.saturated, true);
  assert.deepEqual(next.seen, full.seen);
  for (const bad of [{ ...saved, families: ["fake"] }, { ...saved, seen: ["bad"] }, { ...saved, families: ["crt", "crt"] }, { ...saved, seen: [...full.seen, conditionKey(q)] }])
    assert.deepEqual(loadAchievements(bad), loadAchievements(null));
});
