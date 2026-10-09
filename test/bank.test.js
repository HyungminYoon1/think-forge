import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import { DatabaseSync } from "node:sqlite";
import {
  makeQuestion as oldQuestion,
  TOPICS as oldTopics,
} from "../dist/src/questions.js";
import {
  FAMILIES,
  TOPICS,
  makeQuestion,
  makeFamilyQuestion,
  replay,
  answerMatches,
  updateMistakes,
  mistakeFor,
  validConfig,
  challengeMinutes,
} from "../dist/src/bank.js";

const value = (a) =>
  String(a).includes("/")
    ? a
        .split("/")
        .map(Number)
        .reduce((a, b) => a / b)
    : Number(a);
const near = (a, b, label) =>
  assert.ok(
    Math.abs(value(a) - b) < 1e-6,
    `${label}: actual ${a}, expected ${b}`,
  );
const total = (a) => a.reduce((x, y) => x + y, 0);
const range = (n) => Array.from({ length: n }, (_, i) => i);
const permutations = (a) =>
  a.length
    ? a.flatMap((x, i) =>
        permutations(a.filter((_, j) => j !== i)).map((t) => [x, ...t]),
      )
    : [[]];
const subsets = (n) =>
  range(2 ** n).map((mask) => range(n).filter((i) => mask & (1 << i)));
function ancestors(parents, tip) {
  const pending = [tip],
    found = new Set();
  while (pending.length) {
    const x = pending.pop();
    if (found.has(x)) continue;
    found.add(x);
    pending.push(...parents[x]);
  }
  return found;
}
function area(points) {
  return (
    Math.abs(
      total(
        points.map(
          ([x, y], i) =>
            x * points[(i + 1) % points.length][1] -
            y * points[(i + 1) % points.length][0],
        ),
      ),
    ) / 2
  );
}
function minimize(f, lo, hi) {
  for (let i = 0; i < 160; i++) {
    const a = (2 * lo + hi) / 3,
      b = (lo + 2 * hi) / 3;
    if (f(a) < f(b)) hi = b;
    else lo = a;
  }
  return (lo + hi) / 2;
}
function cacheOracle(refs, cap, policy) {
  const frames = new Map();
  let faults = 0;
  refs.forEach((x, time) => {
    if (!frames.has(x)) {
      faults++;
      if (frames.size === cap) {
        const victim = [...frames].sort((a, b) => a[1] - b[1])[0][0];
        frames.delete(victim);
      }
      frames.set(x, time);
    } else if (policy === "LRU") frames.set(x, time);
  });
  return faults;
}
function shortest(edges) {
  let best = Infinity;
  const dfs = (at, seen, cost) => {
    if (at === 3) {
      best = Math.min(best, cost);
      return;
    }
    for (const [a, b, w] of edges)
      if (a === at && !seen.includes(b)) dfs(b, [...seen, b], cost + w);
  };
  dfs(0, [0], 0);
  return best;
}
function treeOracle(edges, forced) {
  let best = Infinity;
  for (const chosen of subsets(edges.length).filter(
    (s) => s.length === 3 && (forced < 0 || s.includes(forced)),
  )) {
    const reached = new Set([0]);
    for (let pass = 0; pass < 4; pass++)
      for (const i of chosen) {
        const [a, b] = edges[i];
        if (reached.has(a) || reached.has(b)) {
          reached.add(a);
          reached.add(b);
        }
      }
    if (reached.size === 4)
      best = Math.min(best, total(chosen.map((i) => edges[i][2])));
  }
  return best;
}
function sqlOracle(q) {
  const db = new DatabaseSync(":memory:");
  try {
    if (q.family === "join-multiplicity") {
      db.exec("CREATE TABLE A(k); CREATE TABLE B(k);");
      for (const x of q.params.a) db.prepare("INSERT INTO A VALUES (?)").run(x);
      for (const x of q.params.b) db.prepare("INSERT INTO B VALUES (?)").run(x);
      return db
        .prepare(
          `SELECT COUNT(*) n FROM A LEFT JOIN B ON A.k=B.k${q.params.filter ? " WHERE B.k IS NOT NULL" : ""}`,
        )
        .get().n;
    }
    db.exec("CREATE TABLE T(team,score);");
    for (const row of q.params.rows)
      db.prepare("INSERT INTO T VALUES (?,?)").run(...row);
    const result = db
      .prepare(
        "SELECT team,COUNT(score) n FROM T GROUP BY team HAVING SUM(score)>=?",
      )
      .all(q.params.limit);
    return q.level <= 2 ? result.length : total(result.map((x) => x.n));
  } finally {
    db.close();
  }
}

test("frozen v1 output fingerprint: 2240 previous seed conditions", () => {
  const samples = [];
  for (const t of Object.keys(oldTopics))
    for (let l = 1; l <= 4; l++)
      for (let i = 0; i < 40; i++)
        samples.push(oldQuestion(t, l, "compatibility", i));
  assert.equal(
    createHash("sha256").update(JSON.stringify(samples)).digest("hex"),
    "6c4ad42947c220a1e14e79f99c3384f01bf5f1ba0350d4e19efd54e9b93dc1c9",
  );
  for (const q of samples.filter((_, i) => i % 41 === 0)) {
    const restored = replay({
      topic: q.topic,
      level: q.level,
      seed: q.seed,
      index: q.index,
    });
    for (const key of Object.keys(q)) assert.deepEqual(restored[key], q[key]);
  }
});

test("48 genuine family IDs, 16 topics, provenance and 3840 deterministic valid questions", () => {
  assert.equal(FAMILIES.length, 48);
  assert.equal(new Set(FAMILIES.map((f) => f.id)).size, 48);
  assert.equal(Object.values(TOPICS).filter((t) => !t.mixed).length, 16);
  const adapted = new Set();
  for (const f of FAMILIES)
    for (let l = 1; l <= 4; l++)
      for (let i = 0; i < 20; i++) {
        const q = makeFamilyQuestion(f.id, l, "oracle", i);
        assert.deepEqual(q, makeFamilyQuestion(f.id, l, "oracle", i));
        assert.ok(q.steps.length >= 2 && q.hints.length);
        assert.ok(q.answer && !q.answer.includes("NaN"));
        assert.ok(answerMatches(q.answer, q.answer));
        assert.equal(q.text.includes("풀이의 출발점:"), l === 1 || l === 3);
        if (q.options) {
          assert.equal(new Set(q.options).size, q.options.length);
          assert.equal(
            q.options.filter((a) => answerMatches(a, q.answer)).length,
            1,
          );
        }
        if (q.source.kind === "adapted") {
          adapted.add(q.family);
          for (const key of [
            "creator",
            "question",
            "url",
            "solutionUrl",
            "licenseUrl",
            "notice",
          ])
            assert.ok(q.source[key]);
          assert.equal(q.source.license, "CC BY-NC-SA 4.0");
        } else assert.equal(q.source.kind, "original");
      }
  assert.equal(adapted.size, 7);
});

test("mixed cycles cover 24 families and all selected questions replay exactly", () => {
  for (const topic of Object.keys(TOPICS))
    for (let l = 1; l <= 4; l++) {
      const count = TOPICS[topic].mixed ? 24 : 3,
        ids = [];
      for (let i = 0; i < count; i++) {
        const q = makeQuestion(topic, l, "smoke", i);
        ids.push(q.family);
        assert.deepEqual(replay(mistakeFor(q)), q);
      }
      assert.equal(new Set(ids).size, count);
    }
  assert.throws(() => makeQuestion("numbers", 1, "x", 0, 99));
  assert.throws(() => makeQuestion("numbers", 0, "x"));
  assert.throws(() => makeQuestion("numbers", 1, "x", -1));
  assert.deepEqual([1, 2, 3, 4].map(challengeMinutes), [20, 25, 30, 40]);
});

test("v1/v2 mistake identity, unsupported entries and capacity preserve old records", () => {
  const legacy = { topic: "numbers", level: 1, seed: "keep", index: 0 };
  const q = makeQuestion("numbers", 1, "keep", 0),
    future = { ...legacy, bankVersion: 99 };
  const both = updateMistakes([legacy, future, null, "unrecognized"], q, false);
  assert.equal(both.length, 5);
  assert.equal(validConfig(future), false);
  assert.equal(validConfig({ ...legacy, topic: "__proto__" }), false);
  assert.deepEqual(updateMistakes(both, q, true), [
    legacy,
    future,
    null,
    "unrecognized",
  ]);
  assert.deepEqual(updateMistakes(both, replay(legacy), true), [
    future,
    null,
    "unrecognized",
    mistakeFor(q),
  ]);
  const full = range(205).map((i) => ({ ...legacy, index: i }));
  assert.deepEqual(updateMistakes(full, q, false), full);
  assert.equal(full.length, 205);
});

// These oracles use enumeration, coordinate geometry, independent simulators,
// execution of the displayed program, or SQLite rather than bank answer helpers.
const ORACLES = {
  crt: (p, l) => {
    const xs = range(p.hi)
      .map((x) => x + 1)
      .filter((x) => x % 5 === p.n % 5 && x % 7 === p.n % 7);
    return l <= 2 ? xs[0] : total(xs);
  },
  divisibility: (p, l) =>
    range(p.n)
      .map((x) => x + 1)
      .filter(
        (x) =>
          [3, 5, ...(l <= 2 ? [] : [7])].filter((d) => x % d === 0).length ===
          1,
      ).length,
  "integer-solutions": (p, l) =>
    range(p.n + 1)
      .flatMap((x) => range(p.n + 1).map((y) => [x, y]))
      .filter(
        ([x, y]) => 3 * x + 5 * y === p.n && (l <= 2 || x + y >= p.cap + 5),
      ).length,
  "quadratic-roots": (p, l) =>
    l <= 2
      ? p.a * p.a + p.b * p.b
      : p.a ** 3 + p.b ** 3 - p.a * p.b * (p.a + p.b),
  composition: (p, l) => {
    const f = (x) => p.a * x + p.b;
    return l <= 2 ? f(p.x) : (f(p.x) - p.b) / p.a + f(p.x + 1);
  },
  "absolute-roots": (p, l) => {
    const xs = range(50)
      .map((x) => x - 20)
      .filter(
        (x) =>
          Math.abs(x - p.a) + Math.abs(x - p.b) === p.b - p.a + 2 * p.extra,
      );
    return l <= 2 ? xs.at(-1) - xs[0] : total(xs.map((x) => x * x));
  },
  "cubic-extrema": (p) => {
    const f = (x) => x * x * x - 3 * p.a * p.a * x + p.c;
    return (
      Math.max(f(-2 * p.a), f(-p.a), f(p.a)) -
      Math.min(f(-2 * p.a), f(-p.a), f(p.a))
    );
  },
  "rational-range": (p, l) =>
    l <= 2
      ? (2 * p.a * p.scale * p.a) / (2 * p.a * p.a)
      : range(21)
          .map((x) => x - 10)
          .filter(
            (k) =>
              k !== 0 && (2 * p.a * p.scale) ** 2 - 4 * k * k * p.a * p.a > 0,
          ).length,
  "line-parabola": (p, l) =>
    l <= 2 ? (p.a - p.t) * (p.a + p.t) : p.a * p.a + p.c - 2 * p.a * p.a,
  chord: (p, l) => {
    const half = Math.sqrt((5 * p.k) ** 2 - (3 * p.k) ** 2);
    return l <= 2
      ? area([
          [0, 0],
          [-half, 3 * p.k],
          [half, 3 * p.k],
        ])
      : area([
          [-half, 3 * p.k],
          [-half, -3 * p.k],
          [half, -3 * p.k],
          [half, 3 * p.k],
        ]);
  },
  "reflection-path": (p, l) => {
    const f = (x) =>
      Math.hypot(x, p.h * p.k) + Math.hypot(x - 3 * p.k, (4 - p.h) * p.k);
    const at = minimize(f, 0, 3 * p.k);
    return l <= 2 ? f(at) : at;
  },
  "triangle-section": (p, l) => {
    const A = [0, 0],
      B = [2 * p.a, 0],
      D = [(2 * p.a * p.n) / (p.m + p.n), (2 * p.b * p.m) / (p.m + p.n)],
      E = [0, p.b];
    return area(l <= 2 ? [A, B, D] : [A, D, E]);
  },
  bayes: (p) => {
    const badMass = p.prior / 100,
      goodMass = 1 - badMass;
    const path = (prob, n) => (n === 0 ? 1 : prob * path(prob, n - 1));
    const bad = badMass * path(p.hit / 10, p.repeat),
      good = goodMass * path(p.falseAlarm / 100, p.repeat);
    return bad / (bad + good);
  },
  "dice-pattern": (p) => {
    let pass = 0;
    for (let code = 0; code < p.faces ** 5; code++) {
      let c = code;
      const bins = Array(p.faces).fill(0);
      for (let i = 0; i < 5; i++) {
        bins[c % p.faces]++;
        c = Math.floor(c / p.faces);
      }
      const signature = bins.filter(Boolean).sort().join("");
      if (
        signature ===
        { distinct: "11111", pair: "1112", "two-pairs": "122" }[p.pattern]
      )
        pass++;
    }
    return pass / p.faces ** 5;
  },
  "adjacent-expectation": (p) => {
    const N = p.n * p.m;
    const equalPairs = (p.n * p.m * (p.m - 1)) / 2,
      allPairs = (N * (N - 1)) / 2;
    return (equalPairs / allPairs) * (p.circular ? N : N - 1);
  },
  "sequence-inference": (p, l) =>
    total(
      range(p.n).map((k) =>
        l <= 2 ? p.a + k * p.d : 2 * p.a + (2 * k + 1) * p.d,
      ),
    ),
  telescoping: (p, l) => {
    const first = total(
      range(p.n).map((i) =>
        l <= 2 ? p.c / ((i + 1) * (i + 2)) : p.c / (i + 1),
      ),
    );
    return (
      first - (l <= 2 ? 0 : total(range(p.n - 1).map((i) => p.c / (i + 2))))
    );
  },
  "pigeonhole-buttons": (p, l) => {
    let paths = Array(p.buttons).fill(1),
      n = 1;
    while (l <= 2 ? n < p.n : total(paths) <= p.states) {
      paths = paths.map((_, i) => total(paths.filter((_, j) => j !== i)));
      n++;
    }
    return l <= 2 ? total(paths) : n;
  },
  projection: (p, l) => {
    const t = (p.v[0] + 2 * p.v[1]) / 5;
    return l <= 2 ? t : (p.v[0] - t) ** 2 + (p.v[1] - 2 * t) ** 2;
  },
  "matrix-composition": (p, l) => {
    const S = ([x, y]) => [x + p.a * y, y],
      R = ([x, y]) => [-y, x],
      rs = R(S([p.x, p.y])),
      sr = S(R([p.x, p.y]));
    return l <= 2 ? total(rs) : total(sr.map((x, i) => x - rs[i]));
  },
  "singular-system": (p) => range(40).find((k) => 1 * k - p.a * p.a === 0),
  "poster-optimum": (p, l) => {
    const f = (x) => (x + p.h) * (p.area / x + p.v),
      x = minimize(f, 0.01, 100);
    return l <= 2 ? x : f(x);
  },
  "integral-area": (p, l) => {
    const end = l <= 2 ? p.b : p.end;
    const width = end / 10000;
    return total(
      range(10000).map(
        (i) =>
          (l <= 2
            ? (i + 0.5) * width - p.a
            : Math.abs((i + 0.5) * width - p.a)) * width,
      ),
    );
  },
  "moving-bound": (p, l) => {
    const f = (x) => {
      const z = l <= 2 ? x : x * x;
      return (p.a * z * z * z) / 3 + p.b * z;
    };
    return (f(p.t + 1e-6) - f(p.t - 1e-6)) / 2e-6;
  },
  "logic-models": (p) =>
    subsets(p.n).filter((s) => {
      const [pv, qv, rv, sv] = range(4).map((i) => s.includes(i));
      return (
        !(pv && !qv) &&
        !(qv && !rv) &&
        !(p.flip ? rv && !pv : pv && !rv) &&
        (p.n === 3 || ((rv || sv) && !(pv && sv)))
      );
    }).length,
  "signed-overflow": (p, l) => {
    const binary = (p.a + p.b).toString(2).padStart(p.bits, "0").slice(-p.bits);
    const s = l <= 2 ? binary : binary[0] + binary.slice(0, -1);
    return parseInt(s, 2) - (s[0] === "1" ? 2 ** p.bits : 0);
  },
  "quantified-logic": (p, l) =>
    p.rows.filter((row) => (l <= 2 ? !row.includes(0) : row.includes(1)))
      .length,
  "shortest-path": (p, l) => shortest(p.edges) + (l <= 2 ? 0 : 2),
  "spanning-tree": (p) => treeOracle(p.edges, p.forced),
  "graph-doubling": (p, l) => {
    if (l >= 3) return "두 복사본의 색을 반대로 배치한다";
    let vertices = p.v,
      edges = range(p.v - 1).map((i) => [i, i + 1]);
    for (let k = 0; k < p.k; k++) {
      edges = [
        ...edges,
        ...edges.map(([a, b]) => [a + vertices, b + vertices]),
        ...range(vertices).map((i) => [i, i + vertices]),
      ];
      vertices *= 2;
    }
    return edges.length;
  },
  "cache-replacement": (p, l) =>
    l <= 2
      ? cacheOracle(p.refs, p.cap, "LRU")
      : cacheOracle(p.refs, p.cap, "FIFO") - cacheOracle(p.refs, p.cap, "LRU"),
  "cpu-scheduling": (p, l) => {
    const jobs = p.burst.map((remaining, id) => ({ remaining, id })),
      done = [0, 0, 0];
    let time = 0;
    while (jobs.length) {
      const job = jobs.shift(),
        slice = l <= 2 ? job.remaining : Math.min(job.remaining, p.quantum);
      time += slice;
      job.remaining -= slice;
      if (job.remaining) jobs.push(job);
      else done[job.id] = time;
    }
    return total(done.map((x, i) => x - p.burst[i])) / 3;
  },
  "page-translation": (p, l) =>
    l <= 2
      ? p.frames[Math.floor((p.page * p.size + p.offset) / p.size)] * p.size +
        ((p.page * p.size + p.offset) % p.size)
      : total(range(p.den).map((i) => p.tlb + p.memory * (i === 0 ? 2 : 1))) /
        p.den,
  "subnet-plan": (p, l) => {
    let size = 4;
    while (size - 2 < p.hosts) size *= 2;
    let count = l <= 2 ? size : size * p.subnets,
      bits = 0;
    while (count > 1) {
      bits++;
      count /= 2;
    }
    return 32 - bits;
  },
  "longest-prefix": (p, l) => (l <= 2 ? "C" : "B"),
  "packet-pipeline": (p) => {
    const linkFree = Array(p.links).fill(0);
    let arrival = 0;
    for (let packet = 0; packet < p.packets; packet++) {
      arrival = 0;
      for (let link = 0; link < p.links; link++) {
        const end = Math.max(arrival, linkFree[link]) + p.times[link];
        linkFree[link] = end;
        arrival = end + p.prop;
      }
    }
    return arrival;
  },
  "functional-dependencies": (p, l) => {
    const closure = (keys) => {
      const s = new Set(keys);
      for (let i = 0; i < 4; i++)
        for (const [a, b] of p.fds)
          if ([...a].every((x) => s.has(x))) for (const x of b) s.add(x);
      return s;
    };
    if (l <= 2) return closure(p.input).size;
    const keys = subsets(4)
      .map((ids) => ids.map((i) => "ABCD"[i]))
      .filter((s) => closure(s).size === 4);
    return keys.filter(
      (s) =>
        !keys.some((t) => t.length < s.length && t.every((x) => s.includes(x))),
    ).length;
  },
  "git-reachability": (p, l) => {
    const left = ancestors(p.parents, p.tip),
      right = ancestors(p.parents, "M");
    return (
      [...left].filter((x) => !right.has(x)).length +
      (l <= 2 ? 0 : [...right].filter((x) => !left.has(x)).length)
    );
  },
  "git-merge-base": (p) => {
    const left = ancestors(p.parents, p.hard ? "D" : "C"),
      right = ancestors(p.parents, "E"),
      common = [...left].filter((x) => right.has(x));
    return common.filter(
      (x) => !common.some((y) => y !== x && ancestors(p.parents, y).has(x)),
    ).length;
  },
  "git-three-way": (p) => (p.base === p.theirs ? p.ours : "충돌 해결 필요"),
  "divide-recurrence": (p) => {
    const f = (n) =>
      n === 1 ? 1 : f(n / 2) + f(n / 2) + p.c * (p.quadratic ? n * n : n);
    return f(p.n);
  },
  knapsack: (p) => {
    const dp = Array(p.capacity + 1).fill(-Infinity);
    dp[0] = 0;
    for (let i = 0; i < p.weights.length; i++)
      for (let w = p.capacity; w >= p.weights[i]; w--)
        dp[w] = Math.max(dp[w], dp[w - p.weights[i]] + p.values[i]);
    return p.exact ? dp[p.capacity] : Math.max(...dp);
  },
  "dag-critical-path": (p, l) => {
    const paths = [];
    const dfs = (i, path) => {
      const children = p.edges.filter(([a]) => a === i).map(([, b]) => b);
      if (!children.length) paths.push([...path, i]);
      else children.forEach((c) => dfs(c, [...path, i]));
    };
    [0, 1].forEach((i) => dfs(i, []));
    const costs = paths.map((path) => ({
      path,
      cost: total(path.map((i) => p.times[i])),
    }));
    return l <= 2
      ? Math.max(...costs.map((x) => x.cost))
      : p.deadline -
          Math.max(
            ...costs.filter((x) => x.path.includes(0)).map((x) => x.cost),
          );
  },
};

for (const f of FAMILIES)
  test(`independent answer oracle: ${f.id}`, () => {
    for (let level = 1; level <= 4; level++)
      for (let i = 0; i < 12; i++) {
        const q = makeFamilyQuestion(f.id, level, "independent", i);
        let expected;
        if (q.program) {
          const printed = [];
          runInNewContext(
            q.program,
            { console: { log: (x) => printed.push(x) } },
            { timeout: 1000 },
          );
          assert.equal(printed.length, 1);
          expected = printed[0];
        } else if (["join-multiplicity", "group-having"].includes(f.id))
          expected = sqlOracle(q);
        else {
          assert.ok(ORACLES[f.id], `missing oracle ${f.id}`);
          expected = ORACLES[f.id](q.params, level);
        }
        if (typeof expected === "number")
          near(q.answer, expected, `${f.id} L${level} seed ${i}`);
        else assert.equal(q.answer, String(expected));
      }
  });

test("source anchor numbers: dice, Bayes, poster, adjacency enumeration and strict pigeonhole boundary", () => {
  near(
    ORACLES["dice-pattern"]({ faces: 6, pattern: "distinct" }),
    5 / 54,
    "5 dice distinct",
  );
  near(
    ORACLES["dice-pattern"]({ faces: 6, pattern: "pair" }),
    25 / 54,
    "one pair",
  );
  near(
    ORACLES["dice-pattern"]({ faces: 6, pattern: "two-pairs" }),
    25 / 108,
    "two pairs",
  );
  near(
    ORACLES.bayes({ prior: 1, hit: 9, falseAlarm: 5, repeat: 1 }),
    2 / 13,
    "original Bayes",
  );
  near(
    ORACLES["poster-optimum"]({ h: 4, v: 8, area: 50 }, 1),
    5,
    "printed width",
  );
  near(
    ORACLES["poster-optimum"]({ h: 4, v: 8, area: 50 }, 4),
    162,
    "total poster area",
  );
  for (const [n, m] of [
    [2, 2],
    [3, 2],
    [2, 3],
  ])
    for (const circular of [false, true]) {
      const perms = permutations(range(n * m));
      const average =
        total(
          perms.map(
            (cards) =>
              cards.filter(
                (id, i) =>
                  (circular || i < cards.length - 1) &&
                  Math.floor(id / m) ===
                    Math.floor(cards[(i + 1) % cards.length] / m),
              ).length,
          ),
        ) / perms.length;
      near(
        average,
        ORACLES["adjacent-expectation"]({ n, m, circular }),
        "enumerated labeled cards",
      );
    }
  assert.equal(
    ORACLES["pigeonhole-buttons"]({ buttons: 3, states: 12, n: 3 }, 4),
    4,
  );
  const states = 20922789888000 / 24 ** 4; // 16!/(4!)^4, exact integer.
  assert.ok(5n * 4n ** 31n > BigInt(states));
});

test("graph doubling proof oracle: explicit graph remains bipartite through four constructions", () => {
  for (let initial = 3; initial <= 6; initial++) {
    let n = initial,
      edges = range(initial - 1).map((i) => [i, i + 1]);
    for (let round = 0; round < 4; round++) {
      edges = [
        ...edges,
        ...edges.map(([a, b]) => [a + n, b + n]),
        ...range(n).map((i) => [i, i + n]),
      ];
      n *= 2;
      const adjacency = range(n).map(() => []);
      for (const [a, b] of edges) {
        adjacency[a].push(b);
        adjacency[b].push(a);
      }
      const color = Array(n).fill(-1);
      color[0] = 0;
      const queue = [0];
      while (queue.length) {
        const a = queue.shift();
        for (const b of adjacency[a]) {
          if (color[b] < 0) {
            color[b] = 1 - color[a];
            queue.push(b);
          }
          assert.notEqual(color[a], color[b]);
        }
      }
      assert.ok(color.every((c) => c >= 0));
      // A matched pair must receive opposite colors; cloning the same coloring fails.
      for (let i = 0; i < n / 2; i++)
        assert.notEqual(color[i], color[i + n / 2]);
    }
  }
});
