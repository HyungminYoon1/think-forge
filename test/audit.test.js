import test from "node:test";
import assert from "node:assert/strict";
import { FAMILIES, makeFamilyQuestion } from "../dist/src/bank.js";
const number = (s) => String(s).split("/").map(Number).reduce((a, b) => a / b);
const build = (id, level, values) => {
  let at = 0;
  const q = FAMILIES.find((f) => f.id === id).build((lo, hi) => {
    const value = values[at++];
    assert.ok(value >= lo && value <= hi);
    return value;
  }, level);
  assert.equal(at, values.length);
  return q;
};
test("all CRT bounds: solve displayed congruences without the bank's known minimum", () => {
  for (let n = 10; n <= 24; n++)
    for (let boundary = 1; boundary <= 5; boundary++)
      for (const level of [2, 4]) {
        const q = build("crt", level, [n, boundary]);
        const [a, b] = [...q.text.matchAll(/≡ (\d+)/g)].map((m) => Number(m[1]));
        const hi = level === 4 ? Number(q.text.match(/x ≤ (\d+)/)[1]) : 35;
        const solutions = [];
        for (let x = 1; x <= hi; x++) if (x % 5 === a && x % 7 === b) solutions.push(x);
        assert.equal(number(q.answer), level === 2 ? solutions[0] : solutions.reduce((a, b) => a + b, 0));
        assert.ok(solutions.length && solutions.every((x) => x > 0 && x <= hi));
      }
});
test("integer constraints include zero and infeasible cases across the entire generated range", () => {
  let sawZero = false, sawBoundary = false;
  for (let n = 28; n <= 45; n++)
    for (let cap = 3; cap <= 6; cap++)
      for (const level of [2, 4]) {
        const q = build("integer-solutions", level, [n, cap]);
        let count = 0;
        for (let y = 0; 5 * y <= n; y++) {
          const x = (n - 5 * y) / 3;
          if (Number.isInteger(x) && x >= 0 && (level === 2 || x + y >= cap + 5)) {
            count++;
            if (level === 4 && x + y === cap + 5) sawBoundary = true;
          }
        }
        if (!count) sawZero = true;
        assert.equal(number(q.answer), count);
      }
  assert.ok(sawZero && sawBoundary);
});
test("longest-prefix answer uses actual IPv4 masks, including every generated address", () => {
  const ip = (s) => s.split(".").reduce((n, part) => (n * 256 + Number(part)) >>> 0, 0);
  for (let octet = 130; octet <= 190; octet++)
    for (const level of [2, 4]) {
      const q = build("longest-prefix", level, [octet]);
      const destination = ip(q.text.match(/10\.4\.\d+\.9/)[0]);
      const matches = q.visual.rows.filter(([cidr, link]) => {
        if (level === 4 && link === "C") return false;
        const [network, prefix] = cidr.split("/");
        const bits = Number(prefix), mask = bits ? (0xffffffff << (32 - bits)) >>> 0 : 0;
        return ((destination & mask) >>> 0) === ((ip(network) & mask) >>> 0);
      }).sort((a, b) => Number(b[0].split("/")[1]) - Number(a[0].split("/")[1]));
      assert.equal(q.answer, matches[0][1]);
      assert.notEqual(q.answer, "D", "fallback default is not the longest surviving match");
    }
});
test("functional dependencies via counterexample relations, not another closure algorithm", () => {
  // A dependency follows iff there is no legal two-tuple counterexample.
  const tuples = Array.from({ length: 16 }, (_, n) => Array.from({ length: 4 }, (_, i) => (n >> i) & 1));
  const agree = (a, b, attrs) => [...attrs].every((name) => a["ABCD".indexOf(name)] === b["ABCD".indexOf(name)]);
  for (let choice = 0; choice < 3; choice++)
    for (let input = 0; input < 6; input++)
      for (const level of [2, 4]) {
        const q = build("functional-dependencies", level, [choice, input]), p = q.params;
        const legalPairs = tuples.flatMap((a) => tuples.map((b) => [a, b])).filter(([a, b]) =>
          p.fds.every(([left, right]) => !agree(a, b, left) || agree(a, b, right)));
        const determines = (left, right) => legalPairs.every(([a, b]) => !agree(a, b, left) || agree(a, b, right));
        const closureCount = [..."ABCD"].filter((name) => determines(p.input, name)).length;
        const keys = tuples.map((bits) => [..."ABCD"].filter((_, i) => bits[i]).join(""))
          .filter((left) => determines(left, "ABCD"));
        const minimal = keys.filter((key) => !keys.some((other) => other.length < key.length && [...other].every((x) => key.includes(x))));
        assert.equal(number(q.answer), level === 2 ? closureCount : minimal.length);
        assert.ok(minimal.every((key) => key.includes("D")));
      }
});
function bipartite(n, edges) {
  const colors = Array(n).fill(-1);
  for (let start = 0; start < n; start++) {
    if (colors[start] !== -1) continue;
    colors[start] = 0;
    const queue = [start];
    while (queue.length) {
      const at = queue.shift();
      const neighbors = edges.flatMap(([a, b]) => a === at ? [b] : b === at ? [a] : []);
      for (const neighbor of neighbors) {
        if (colors[neighbor] === colors[at]) return false;
        if (colors[neighbor] === -1) { colors[neighbor] = 1 - colors[at]; queue.push(neighbor); }
      }
    }
  }
  return true;
}
test("graph proof: correct coloring is legal; same-color and parity-only distractors have counterexamples", () => {
  const q = makeFamilyQuestion("graph-doubling", 4, "proof");
  assert.equal(q.options.length, 4);
  // Triangle plus a pendant edge: even vertices AND edges, yet not bipartite.
  assert.equal(bipartite(4, [[0, 1], [1, 2], [2, 0], [2, 3]]), false);
  for (let n = 3; n <= 6; n++) {
    const tree = Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);
    const clone = [...tree, ...tree.map(([a, b]) => [a + n, b + n]), ...Array.from({ length: n }, (_, i) => [i, i + n])];
    assert.equal(bipartite(n * 2, clone), true);
    const wrongColors = Array.from({ length: n * 2 }, (_, i) => (i % n) % 2);
    assert.ok(clone.some(([a, b]) => wrongColors[a] === wrongColors[b]));
    const colors = Array.from({ length: n * 2 }, (_, i) => ((i % n) % 2) ^ (i >= n ? 1 : 0));
    assert.ok(clone.every(([a, b]) => colors[a] !== colors[b]));
  }
});
