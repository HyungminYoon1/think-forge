import test from "node:test";
import assert from "node:assert/strict";
import { makeFamilyQuestion } from "../dist/src/bank.js";
import { reasoningCriteria, scoreReasoning } from "../dist/src/reasoning.js";

// Independent routes: population enumeration, time-step simulation, coordinate
// interpolation, orthogonality search, and numerical optimization.
const oracle = {
  composition(q) {
    const [slope, offset] = q.text.match(/f\(f\(x\)\)=(\d+)x\+(\d+)/).slice(1).map(Number);
    const a = Array.from({ length: 8 }, (_, i) => i + 1).find((a) => a * a === slope);
    const b = Array.from({ length: 10 }, (_, i) => i).find((b) => a * b + b === offset);
    return { slope: a, intercept: b };
  },
  "triangle-section"({ params: p }) {
    const B = [2 * p.a, 0], C = [0, 2 * p.b];
    const ratio = p.m / (p.m + p.n);
    const D = B.map((v, i) => v + ratio * (C[i] - v));
    return { dx: D[0], dy: D[1] };
  },
  bayes({ params: p }) {
    const all = 100 ** p.repeat;
    const count = (threshold) => {
      let hit = 0;
      for (let code = 0; code < all; code++) {
        let current = code, pass = true;
        for (let step = 0; step < p.repeat; step++) {
          if (current % 100 >= threshold) pass = false;
          current = Math.floor(current / 100);
        }
        if (pass) hit++;
      }
      return hit;
    };
    return { bad: count(p.hit * 10) * p.prior / (100 * all), good: count(p.falseAlarm) * (100 - p.prior) / (100 * all) };
  },
  projection({ params: p }) {
    let coefficient;
    for (let numerator = -100; numerator <= 100; numerator++) {
      const t = numerator / 5;
      const w = p.v.map((v, i) => v - t * p.u[i]);
      if (Math.abs(w[0] * p.u[0] + w[1] * p.u[1]) < 1e-10) coefficient = t;
    }
    return { coefficient, wx: p.v[0] - coefficient, wy: p.v[1] - 2 * coefficient };
  },
  "poster-optimum"({ params: p }) {
    const area = (x) => (x + p.h) * (p.area / x + p.v);
    let lo = 0.01, hi = p.area * 2;
    for (let step = 0; step < 120; step++) {
      const a = (2 * lo + hi) / 3, b = (lo + 2 * hi) / 3;
      if (area(a) < area(b)) hi = b;
      else lo = a;
    }
    const width = Math.round((lo + hi) / 2);
    assert.ok(area(width) < area(width + 0.01));
    assert.ok(area(width) < area(width - 0.01));
    return { width, height: p.area / width };
  },
  "cpu-scheduling"(q) {
    const remain = [...q.params.burst], pending = [0, 1, 2], done = {};
    let time = 0;
    while (pending.length) {
      const i = pending.shift();
      let allowance = q.level <= 2 ? Infinity : q.params.quantum;
      while (remain[i] > 0 && allowance > 0) { remain[i]--; allowance--; time++; }
      if (remain[i]) pending.push(i);
      else done["p" + i] = time;
    }
    return done;
  },
  "packet-pipeline"({ params: p }) {
    const available = p.times.map(() => 0), arrivals = [];
    for (let packet = 0; packet < p.packets; packet++) {
      let at = 0;
      for (let link = 0; link < p.links; link++) {
        const end = Math.max(at, available[link]) + p.times[link];
        available[link] = end;
        at = end + p.prop;
      }
      arrivals.push(at);
    }
    assert.ok(arrivals.slice(1).every((x, i) => x - arrivals[i] === arrivals[1] - arrivals[0]));
    return { first: arrivals[0], interval: arrivals[1] - arrivals[0] };
  },
  "dag-critical-path"({ params: p }) {
    const started = new Map(), done = new Map();
    for (let time = 0; done.size < p.times.length; time++) {
      for (const [i, at] of started)
        if (at + p.times[i] === time) done.set(i, time);
      for (let i = 0; i < p.times.length; i++)
        if (!started.has(i) && p.edges.filter(([, b]) => b === i).every(([a]) => done.has(a))) started.set(i, time);
      assert.ok(time < 100);
    }
    return { cstart: started.get(2), dend: done.get(3), estart: started.get(4) };
  },
};
for (const family of Object.keys(oracle))
  test("checkpoint verifier: " + family, () => {
    for (const level of [1, 2, 3, 4])
      for (let index = 0; index < 16; index++) {
        const q = makeFamilyQuestion(family, level, "checkpoint", index);
        const before = structuredClone(q);
        const inputs = Object.fromEntries(Object.entries(oracle[family](q)).map(([key, value]) => [key, String(value)]));
        const score = scoreReasoning(q, inputs);
        assert.equal(score.earned, score.total, q.id);
        assert.ok(score.total >= 2);
        assert.deepEqual(q, before);
        for (const key of Object.keys(inputs)) {
          const wrong = scoreReasoning(q, { ...inputs, [key]: String(Number(inputs[key]) + 1) });
          assert.equal(wrong.earned, score.total - 1, key + " wrong intermediate must lose its point");
          assert.equal(scoreReasoning(q, { ...inputs, [key]: "" }).attempted, score.total - 1);
        }
      }
  });

test("optional rubric: unsupported/legacy, empty, partial, fraction and malformed input", () => {
  assert.deepEqual(reasoningCriteria({ bankVersion: 1 }), []);
  const unsupported = makeFamilyQuestion("crt", 4, "smoke");
  assert.equal(scoreReasoning(unsupported, {}).total, 0);
  const q = makeFamilyQuestion("triangle-section", 4, "smoke");
  const criteria = reasoningCriteria(q);
  assert.equal(scoreReasoning(q).attempted, 0);
  const c = criteria[0], [a, b = 1] = c.answer.split("/").map(Number);
  assert.equal(scoreReasoning(q, { [c.id]: (2 * a) + "/" + (2 * b) }).earned, 1);
  for (const value of ["1/0", "undefined", "x=3", "0".repeat(41), 3, [], null])
    assert.equal(scoreReasoning(q, { [c.id]: value }).earned, 0);
  assert.equal(scoreReasoning(q, null).earned, 0);
  assert.equal(scoreReasoning(q, { invented: "1", ...Object.fromEntries(criteria.map((c) => [c.id, c.answer])) }).earned, criteria.length);
});
