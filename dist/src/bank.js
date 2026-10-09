import {
  TOPICS as OLD_TOPICS,
  makeQuestion as legacyQuestion,
  answerMatches,
} from "./questions.js";
import { rng, shuffle } from "./core.js";
import { MATH } from "./math-bank.js";
import { CS } from "./cs-bank.js";
import { ORIGINAL } from "./sources.js";
export { answerMatches };
export const BANK_VERSION = 2;
export const TOPICS = {
  "math-mix": { name: "수학 전체 · 혼합 출제", subject: "math", mixed: true },
  "cs-mix": { name: "전공 전체 · 혼합 출제", subject: "cs", mixed: true },
  ...OLD_TOPICS,
  numbers: { name: "정수·나머지·계수", subject: "math" },
  graphs: { name: "함수·극값·교점", subject: "math" },
  calculus: { name: "미적분·최적화", subject: "math" },
  recurrences: { name: "점화식·DP·작업 DAG", subject: "cs" },
};
export const FAMILIES = [...MATH, ...CS];
export const LEVELS = [
  "",
  "1 · 단계 안내",
  "2 · 독립 추론",
  "3 · 복합 조건 안내",
  "4 · 복합 조건 독립 풀이",
];
export const challengeMinutes = (level) => [0, 20, 25, 30, 40][level];
export function validConfig(item) {
  const version = item?.bankVersion ?? 1;
  return (
    !!item &&
    (version === 1
      ? Object.hasOwn(OLD_TOPICS, item.topic)
      : version === 2 && Object.hasOwn(TOPICS, item.topic)) &&
    Number.isInteger(item.level) &&
    item.level >= 1 &&
    item.level <= 4 &&
    typeof item.seed === "string" &&
    item.seed.length <= 40 &&
    Number.isSafeInteger(item.index) &&
    item.index >= 0
  );
}
export function makeQuestion(
  topic,
  level,
  seed,
  index = 0,
  bankVersion = BANK_VERSION,
) {
  if (!validConfig({ topic, level, seed, index, bankVersion }))
    throw TypeError("Unsupported bank or question configuration");
  if (bankVersion === 1)
    return {
      ...legacyQuestion(topic, level, seed, index),
      bankVersion: 1,
      family: "legacy",
      selectionTopic: topic,
      source: ORIGINAL,
    };
  const candidates = FAMILIES.filter((f) =>
    TOPICS[topic].mixed
      ? TOPICS[f.topic].subject === TOPICS[topic].subject
      : f.topic === topic,
  );
  // One shuffled cycle visits every eligible family before repeating any family.
  const order = shuffle(candidates, rng(`v2|order|${topic}|${level}|${seed}`));
  return makeFamilyQuestion(
    order[index % order.length].id,
    level,
    seed,
    index,
    topic,
  );
}
export function makeFamilyQuestion(id, level, seed, index = 0, selectionTopic) {
  const f = FAMILIES.find((f) => f.id === id);
  if (
    !f ||
    !validConfig({ topic: f.topic, level, seed, index, bankVersion: 2 })
  )
    throw TypeError("Invalid family configuration");
  const random = rng(`v2|${id}|${level}|${seed}|${index}`);
  const int = (lo, hi) => lo + Math.floor(random() * (hi - lo + 1));
  const result = f.build(int, level);
  if (level === 1 || level === 3)
    result.text += `\n\n풀이의 출발점: ${result.hints[0]}`;
  if (result.options)
    result.options = shuffle(result.options.map(String), random);
  return {
    ...result,
    topic: f.topic,
    level,
    seed,
    index,
    selectionTopic: selectionTopic ?? f.topic,
    bankVersion: 2,
    family: id,
    source: result.source ?? ORIGINAL,
    id: `v2-${id}-${level}-${seed}-${index}`,
  };
}
export function replay(item) {
  return makeQuestion(
    item.topic,
    item.level,
    item.seed,
    item.index,
    item.bankVersion ?? 1,
  );
}
export function sameMistake(a, b) {
  if (!a || typeof a !== "object" || !b || typeof b !== "object") return false;
  return (
    (a.bankVersion ?? 1) === (b.bankVersion ?? 1) &&
    a.topic === b.topic &&
    a.level === b.level &&
    a.seed === b.seed &&
    a.index === b.index
  );
}
export function mistakeFor(q) {
  return {
    topic: q.selectionTopic ?? q.topic,
    level: q.level,
    seed: q.seed,
    index: q.index,
    bankVersion: q.bankVersion,
  };
}
export function updateMistakes(items, q, correct) {
  const item = mistakeFor(q);
  if (correct) return items.filter((m) => !sameMistake(m, item));
  // Never evict prior records when the 200-item limit is reached.
  if (items.some((m) => sameMistake(m, item)) || items.length >= 200)
    return [...items];
  return [...items, item];
}
