import test from "node:test";
import assert from "node:assert/strict";
import {
  TOPICS,
  makeQuestion,
  answerMatches,
  gcd,
} from "../dist/src/questions.js";
test("56 topic/difficulty combinations deterministic and valid", () => {
  for (const topic of Object.keys(TOPICS))
    for (let level = 1; level <= 4; level++)
      for (let i = 0; i < 40; i++) {
        const a = makeQuestion(topic, level, "qa-seed", i);
        assert.deepEqual(a, makeQuestion(topic, level, "qa-seed", i));
        assert.ok(a.answer);
        assert.ok(a.steps.length);
        assert.ok(a.hints.length);
        assert.ok(answerMatches(a.answer, a.answer));
        if (a.options) {
          assert.equal(new Set(a.options).size, a.options.length);
          assert.equal(
            a.options.filter((v) => answerMatches(v, a.answer)).length,
            1,
          );
        }
      }
});
test("fraction equivalence and blank rejection", () => {
  assert.ok(answerMatches("2/4", "1/2"));
  assert.ok(answerMatches("0.5", "1/2"));
  assert.ok(!answerMatches("", "0"));
  assert.ok(!answerMatches("1/0", "2"));
  assert.equal(gcd(12, 18), 6);
});
test("variants change and invalid configs reject", () => {
  assert.notDeepEqual(
    makeQuestion("geometry", 4, "aaa"),
    makeQuestion("geometry", 4, "bbb"),
  );
  assert.throws(() => makeQuestion("fake", 1, "x"));
  assert.throws(() => makeQuestion("code", 9, "x"));
});
test("linear and code answers independently recomputed", () => {
  for (let i = 0; i < 100; i++) {
    const q = makeQuestion("algebra", 1, "linear", i);
    const m = q.text.match(/^(\d+)x \+ (\d+) = (-?\d+)$/);
    assert.ok(m);
    assert.equal(
      Number(q.answer),
      (Number(m[3]) - Number(m[2])) / Number(m[1]),
    );
    const c = makeQuestion("code", 1, "code", i);
    const n = Number(c.text.match(/i <= (\d+)/)[1]),
      offset = Number(c.text.match(/sum = (\d+)/)[1]),
      step = Number(c.text.match(/i \* (\d+)/)[1]);
    let sum = offset;
    for (let j = 1; j <= n; j++) sum += j * step;
    assert.equal(Number(c.answer), sum);
  }
});
