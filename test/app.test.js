// Node DOM test double only: lifecycle checks, NOT browser/rendering evidence.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { makeQuestion, replay } from "../dist/src/bank.js";

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
    stored = saved ? JSON.stringify(saved) : null,
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
    getItem: () => stored,
    setItem: (_, v) => {
      stored = v;
    },
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
    record: () => (stored ? JSON.parse(stored) : null),
    mode: (mode) => modes.find((b) => b.dataset.mode === mode).click(),
    topic: (value) => {
      els.get("topic").value = value;
      els.get("topic").onchange();
    },
    level: (value) => {
      els.get("difficulty").value = String(value);
      els.get("difficulty").onchange();
    },
    seed: () => {
      els.get("seed").value = "smoke";
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
