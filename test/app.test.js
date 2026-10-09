// Node DOM test double only: lifecycle checks, NOT browser/rendering evidence.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { makeQuestion, replay } from "../dist/src/bank.js";
import { reasoningCriteria } from "../dist/src/reasoning.js";
import { recordAttempt } from "../dist/src/achievements.js";
import { PROGRESS_KEY } from "../dist/src/progress.js";

class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.children = [];
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.hidden = false;
    this.disabled = false;
    this.value = "";
    this.className = "";
    this._text = "";
    this.events = {};
  }
  set textContent(v) {
    this._text = String(v);
    this.children = [];
  }
  get textContent() {
    return this._text + this.children.map((c) => c.textContent).join("");
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren(...children) {
    this._text = "";
    this.children = [...children];
  }
  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }
  addEventListener(name, fn) {
    this.events[name] = fn;
  }
  querySelector(tag) {
    return (
      this.children.find((c) => c.tagName === tag) ??
      this.children.map((c) => c.querySelector(tag)).find(Boolean)
    );
  }
  get classList() {
    return {
      toggle: (name, force) => {
        const set = new Set(this.className.split(" ").filter(Boolean));
        if (force ?? !set.has(name)) set.add(name);
        else set.delete(name);
        this.className = [...set].join(" ");
      },
    };
  }
  click() {
    this.onclick?.();
  }
}
let nonce = 0;
async function app(t, saved) {
  const html = await readFile(
    new URL("../dist/index.html", import.meta.url),
    "utf8",
  );
  const els = new Map(
    [...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, new Element()]),
  );
  const subjects = ["math", "cs"].map((subject) =>
    Object.assign(new Element("button"), { dataset: { subject } }),
  );
  const modes = ["learn", "challenge", "review"].map((mode) =>
    Object.assign(new Element("button"), { dataset: { mode } }),
  );
  const intervals = new Map();
  let tick = 0,
    time = 2000000000000,
    store = new Map(saved ? [["think-forge-v1", JSON.stringify(saved)]] : []),
    blob;
  const originals = {};
  const install = (key, v) => {
    originals[key] = globalThis[key];
    globalThis[key] = v;
  };
  install("document", {
    getElementById: (id) => {
      assert.ok(els.has(id), `missing actual HTML id ${id}`);
      return els.get(id);
    },
    createElement: (tag) => new Element(tag),
    createElementNS: (_, tag) => new Element(tag),
    querySelectorAll: (selector) =>
      selector === "[data-subject]"
        ? subjects
        : selector === "[data-mode]"
          ? modes
          : [],
  });
  install("localStorage", {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, v) => store.set(key, v),
    removeItem: (key) => store.delete(key),
  });
  install("addEventListener", () => {});
  install("setInterval", (fn) => {
    intervals.set(++tick, fn);
    return tick;
  });
  install("clearInterval", (id) => intervals.delete(id));
  install("setTimeout", () => 0);
  install("confirm", () => true);
  const oldNow = Date.now,
    oldCreate = URL.createObjectURL;
  Date.now = () => time;
  URL.createObjectURL = (b) => {
    blob = b;
    return "blob:test";
  };
  t.after(() => {
    for (const [k, v] of Object.entries(originals)) {
      if (v === undefined) delete globalThis[k];
      else globalThis[k] = v;
    }
    Date.now = oldNow;
    URL.createObjectURL = oldCreate;
  });
  await import(`../dist/src/app.js?dom-test=${++nonce}`);
  return {
    html,
    el: (id) => els.get(id),
    record: () => store.has("think-forge-v1") ? JSON.parse(store.get("think-forge-v1")) : null,
    store,
    mode: (mode) => modes.find((b) => b.dataset.mode === mode).click(),
    topic: (value) => {
      els.get("topic").value = value;
      els.get("topic").onchange();
    },
    level: (value) => {
      els.get("difficulty").value = String(value);
      els.get("difficulty").onchange();
    },
    seed: (value = "smoke") => {
      els.get("seed").value = value;
      els.get("apply-seed").click();
    },
    answer: (value) => {
      els.get("answer").value = value;
      els.get("submit").click();
    },
    advance: (ms) => {
      time += ms;
    },
    tick: () => {
      for (const fn of intervals.values()) fn();
    },
    intervals,
    exported: async () => JSON.parse(await blob.text()),
  };
}
test("DOM double: launch selects level 4 in HTML and JS with complex independent content", async (t) => {
  const a = await app(t);
  const markup = a.html.match(
    /<select id="difficulty">([\s\S]*?)<\/select>/,
  )[1];
  assert.match(markup, /<option value="4" selected>/);
  assert.equal([...markup.matchAll(/\bselected\b/g)].length, 1);
  assert.equal(a.el("difficulty").value, "4");
  assert.equal(a.el("topic").value, "math-mix");
  assert.match(a.el("breadcrumb").textContent, /4 · 복합 조건 독립 풀이$/);
  assert.match(a.el("challenge-help").textContent, /40분/);
  const initial = makeQuestion("math-mix", 4, a.el("seed").value, 0);
  assert.equal(a.el("question-text").textContent, initial.text);
  assert.ok(!a.el("question-text").textContent.includes("풀이의 출발점:"));
  for (const level of [1, 2, 3]) {
    assert.match(markup, new RegExp(`<option value="${level}">`));
    a.level(level);
    assert.equal(
      a.el("question-text").textContent,
      makeQuestion("math-mix", level, a.el("seed").value, 0).text,
    );
    assert.equal(a.el("difficulty").value, String(level));
  }
});
test("DOM double: real HTML IDs, blank/duplicate submission and normal next", async (t) => {
  const a = await app(t);
  a.level(1);
  a.seed();
  const q = makeQuestion("math-mix", 1, "smoke", 0);
  assert.equal(a.el("question-text").textContent, q.text);
  a.answer("");
  assert.equal(a.record(), null);
  assert.match(a.el("notice").textContent, /먼저/);
  a.answer(q.answer);
  assert.equal(a.record().answered, 1);
  a.answer(q.answer);
  assert.equal(a.record().answered, 1);
  assert.equal(a.el("explanation").hidden, false);
  a.el("next").click();
  assert.equal(
    a.el("question-text").textContent,
    makeQuestion("math-mix", 1, "smoke", 1).text,
  );
});
test("DOM double: legacy review and export preserve unknown version, XP and exact seed", async (t) => {
  const legacy = { topic: "algebra", level: 1, seed: "old-seed", index: 3 },
    future = { ...legacy, bankVersion: 99 };
  const a = await app(t, {
    xp: 100,
    answered: 10,
    correct: 4,
    topics: { algebra: { total: 10, correct: 4 } },
    mistakes: [legacy, future],
  });
  a.mode("review");
  assert.equal(a.el("question-text").textContent, replay(legacy).text);
  assert.equal(a.el("seed").value, "old-seed");
  assert.match(a.el("question-source").textContent, /은행 v1/);
  a.answer(replay(legacy).answer);
  assert.deepEqual(a.record().mistakes, [future]);
  assert.equal(a.record().xp, 113);
  a.el("next").click();
  assert.equal(a.el("session-result").hidden, false);
  a.el("export").click();
  const exported = await a.exported();
  assert.equal(exported.version, 2);
  assert.deepEqual(exported.record.mistakes, [future]);
});
test("DOM double: ten-question challenge completes, reviews tables/answers/provenance", async (t) => {
  const a = await app(t);
  a.topic("database");
  a.level(4);
  a.mode("challenge");
  a.seed();
  assert.equal(a.el("session-label").textContent, "40:00");
  assert.equal(a.el("hint").disabled, true);
  for (let i = 0; i < 10; i++) {
    a.el("skip").click();
    if (i < 9) {
      assert.equal(a.el("explanation").hidden, true);
      a.el("next").click();
    }
  }
  const review = a.el("session-result");
  assert.equal(review.hidden, false);
  assert.equal(a.el("question").hidden, true);
  const details = review.children.filter((c) => c.tagName === "details");
  assert.equal(details.length, 10);
  assert.match(details[0].textContent, /내 답: 건너뜀/);
  assert.match(details[0].textContent, /정답: 3/);
  assert.ok(details.some((d) => d.querySelector("table")));
  assert.ok(details.every((d) => d.textContent.includes("은행 v2")));
  assert.equal(a.intervals.size, 0);
  assert.equal(a.record().mistakes.length, 10);
  assert.match(review.textContent, /제출 0 · 건너뜀 10 · 미제출 0/);
});
test("DOM double: submit after deadline cannot score; all unseen questions remain reviewable", async (t) => {
  const a = await app(t);
  a.level(4);
  a.mode("challenge");
  a.seed();
  a.advance(40 * 60000 + 1);
  a.answer(makeQuestion("math-mix", 4, "smoke", 0).answer);
  assert.equal(a.record(), null);
  assert.match(a.el("session-result").textContent, /미제출 10/);
  assert.equal(
    a.el("session-result").children.filter((c) => c.tagName === "details")
      .length,
    10,
  );
  assert.equal(a.intervals.size, 0);
  a.tick();
  assert.equal(a.record(), null);
});
test("DOM double: capacity does not evict legacy mistakes and announces limit", async (t) => {
  const mistakes = Array.from({ length: 200 }, (_, index) => ({
    topic: "numbers",
    level: 1,
    seed: "old",
    index,
  }));
  const a = await app(t, {
    xp: 0,
    answered: 0,
    correct: 0,
    topics: {},
    mistakes,
  });
  a.seed();
  a.el("skip").click();
  assert.deepEqual(a.record().mistakes, mistakes);
  assert.match(a.el("notice").textContent, /기존 기록은 유지/);
});

test("DOM double: optional checkpoints have partial feedback and do not affect answer/XP or completion", async (t) => {
  const a = await app(t);
  a.topic("calculus"); a.seed();
  const q = makeQuestion("calculus", 4, "smoke", 0);
  assert.equal(q.family, "poster-optimum");
  assert.equal(a.el("reasoning-panel").hidden, false);
  a.el("reasoning-panel").open = true;
  a.el("reasoning-panel").ontoggle();
  const inputs = a.el("reasoning-fields").children.filter((el) => el.tagName === "input");
  const criteria = reasoningCriteria(q);
  inputs[0].value = criteria[0].answer;
  inputs[1].value = "0";
  a.answer(q.answer);
  assert.match(a.el("reasoning-result").textContent, /풀이 점검 1\/2/);
  assert.match(a.el("reasoning-result").textContent, /다시 확인/);
  assert.equal(a.record().correct, 1);
  assert.equal(a.record().xp, 22);
  assert.equal(a.record().achievements.families.length, 0);
  assert.ok(inputs.every((el) => el.disabled));
  a.el("export").click();
  assert.equal(JSON.stringify(await a.exported()).includes("reasoning"), false, "do not persist raw checkpoint inputs");
  a.el("next").click();
  assert.equal(a.el("reasoning-result").textContent, "");
});

test("DOM double: checkpoint success cannot turn a wrong final answer into a correct answer", async (t) => {
  const a = await app(t);
  a.topic("calculus"); a.seed();
  const q = makeQuestion("calculus", 4, "smoke", 0);
  const inputs = a.el("reasoning-fields").children.filter((el) => el.tagName === "input");
  reasoningCriteria(q).forEach((c, i) => { inputs[i].value = c.answer; });
  a.answer("0");
  assert.match(a.el("reasoning-result").textContent, /풀이 점검 2\/2/);
  assert.equal(a.record().correct, 0);
  assert.equal(a.record().xp, 2);
  assert.equal(a.record().mistakes.length, 1);
});

test("DOM double: exam checkpoint feedback waits for finish and submitted/skip/unsubmitted are distinct", async (t) => {
  const a = await app(t);
  a.topic("calculus"); a.mode("challenge"); a.seed();
  const q = makeQuestion("calculus", 4, "smoke", 0);
  const inputs = a.el("reasoning-fields").children.filter((el) => el.tagName === "input");
  reasoningCriteria(q).forEach((c, i) => { inputs[i].value = c.answer; });
  a.answer(q.answer);
  assert.equal(a.el("reasoning-result").textContent, "");
  assert.equal(a.el("explanation").hidden, true);
  a.el("next").click(); a.el("skip").click();
  a.advance(40 * 60000 + 1); a.tick();
  assert.match(a.el("session-result").textContent, /제출 1 · 건너뜀 1 · 미제출 8/);
  assert.match(a.el("session-result").textContent, /제출 답 정답률 100%/);
  assert.match(a.el("session-result").textContent, /풀이 점검 2\/2/);
});

test("DOM double: actual independent answer saves minimal summary; initial/hint/replay never award", async (t) => {
  const a = await app(t);
  assert.equal(a.store.has(PROGRESS_KEY), false);
  a.seed();
  const q = makeQuestion("math-mix", 4, "smoke", 0);
  a.answer(q.answer);
  const summary = JSON.parse(a.store.get(PROGRESS_KEY));
  assert.equal(summary.apps["think-forge"].completed, 1);
  assert.equal(summary.apps["think-forge"].total, 48);
  assert.deepEqual(Object.keys(summary.apps["think-forge"]).sort(), ["completed", "total", "updatedAt"]);
  a.seed(); a.answer(q.answer);
  assert.equal(a.record().achievements.families.length, 1);
  assert.equal(a.store.get(PROGRESS_KEY), JSON.stringify(summary));
  a.el("next").click();
  a.el("hint").click();
  a.answer(makeQuestion("math-mix", 4, "smoke", 1).answer);
  assert.equal(a.record().achievements.families.length, 1);
  a.seed(); a.el("next").click();
  assert.equal(a.store.get(PROGRESS_KEY), JSON.stringify(summary));
});

test("DOM double: old XP does not invent achievements; runtime cap/export/own-only deletion", async (t) => {
  const a = await app(t, { xp: 1e9, correct: 99, answered: 99, topics: {}, mistakes: [] });
  assert.equal(a.el("independent-count").textContent, "0 / 48");
  a.store.set(PROGRESS_KEY, JSON.stringify({ version: 1, apps: {
    "light-route": { completed: 3, total: 8, updatedAt: "2026-10-09T00:00:00.000Z" },
  } }));
  a.seed(); a.answer(makeQuestion("math-mix", 4, "smoke", 0).answer);
  assert.equal(a.record().xp, 1e9);
  assert.equal(a.record().achievements.families.length, 1);
  a.el("export").click();
  assert.equal((await a.exported()).record.xp, 1e9);
  a.el("clear").click();
  assert.equal(a.record().xp, 0);
  const apps = JSON.parse(a.store.get(PROGRESS_KEY)).apps;
  assert.equal(Object.hasOwn(apps, "think-forge"), false);
  assert.equal(apps["light-route"].completed, 3);
});

test("DOM double: durable evidence reloads, private storage failure cannot publish completion", async (t) => {
  const q = makeQuestion("math-mix", 4, "smoke", 0);
  const evidence = recordAttempt(null, q, { correct: true });
  const a = await app(t, { xp: 22, correct: 1, answered: 1, topics: {}, mistakes: [], achievements: evidence });
  assert.equal(a.el("independent-count").textContent, "1 / 48");
  assert.equal(a.store.has(PROGRESS_KEY), false, "loading evidence is not a new completion");
  a.el("hint").click();
  assert.equal(a.store.has(PROGRESS_KEY), false, "hint cannot create an aggregate even with old achievements");
  globalThis.localStorage.setItem = (key) => { if (key === "think-forge-v1") throw Error("quota"); };
  a.seed(); a.answer(q.answer);
  assert.equal(a.store.has(PROGRESS_KEY), false);
  assert.match(a.el("notice").textContent, /저장할 수 없습니다/);
  assert.equal(a.el("next").hidden, false);
});

test("DOM double: opening an unsubmitted exam solution blocks subsequent completion of its conditions", async (t) => {
  const a = await app(t);
  a.topic("calculus"); a.mode("challenge"); a.seed();
  const q = makeQuestion("calculus", 4, "smoke", 0);
  a.advance(40 * 60000 + 1); a.tick();
  assert.equal(a.record(), null, "timeout itself earns nothing and creates no attempt");
  const first = a.el("session-result").children.find((el) => el.tagName === "details");
  first.open = true;
  first.ontoggle();
  assert.equal(a.record().answered, 0);
  assert.equal(a.record().xp, 0);
  assert.equal(a.record().mistakes.length, 0);
  assert.equal(a.record().achievements.seen.length, 1);
  a.mode("learn"); a.seed(); a.answer(q.answer);
  assert.equal(a.record().correct, 1);
  assert.equal(a.record().achievements.families.length, 0);
  assert.equal(a.store.has(PROGRESS_KEY), false);
});
