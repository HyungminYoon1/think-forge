import { frac } from "./exam-utils.js";
import { answerMatches } from "./questions.js";

const criterion = (id, label, answer) => ({ id, label, answer: String(answer) });

// Numeric checkpoints, not natural-language or proof grading. No IO.
export function reasoningCriteria(question) {
  if (question?.bankVersion !== 2 || !question.params) return [];
  const p = question.params;
  switch (question.family) {
    case "composition":
      return [
        criterion("slope", "복원한 함수의 기울기 a", p.a),
        criterion("intercept", "복원한 함수의 상수항 b", p.b),
      ];
    case "triangle-section":
      return [
        criterion("dx", "내분점 D의 x좌표", frac(2 * p.a * p.n, p.m + p.n)),
        criterion("dy", "내분점 D의 y좌표", frac(2 * p.b * p.m, p.m + p.n)),
      ];
    case "bayes":
      return [
        criterion("bad", "불량이면서 모든 검사에서 경고가 날 확률", frac(p.prior * p.hit ** p.repeat, 100 * 10 ** p.repeat)),
        criterion("good", "정상이면서 모든 검사에서 경고가 날 확률", frac((100 - p.prior) * p.falseAlarm ** p.repeat, 100 ** (p.repeat + 1))),
      ];
    case "projection": {
      const dot = p.v[0] + 2 * p.v[1];
      return [
        criterion("coefficient", "직교분해 계수 t", frac(dot, 5)),
        criterion("wx", "잔차 w의 x성분", frac(5 * p.v[0] - dot, 5)),
        criterion("wy", "잔차 w의 y성분", frac(5 * p.v[1] - 2 * dot, 5)),
      ];
    }
    case "poster-optimum":
      return [
        criterion("width", "최소 넓이일 때 인쇄 가로 x", p.h * p.t),
        criterion("height", "최소 넓이일 때 인쇄 세로 y", p.v * p.t),
      ];
    case "cpu-scheduling": {
      const remaining = [...p.burst], done = [0, 0, 0];
      let time = 0;
      while (remaining.some(Boolean))
        for (let i = 0; i < remaining.length; i++) {
          if (!remaining[i]) continue;
          const slice = question.level <= 2 ? remaining[i] : Math.min(p.quantum, remaining[i]);
          time += slice;
          remaining[i] -= slice;
          if (!remaining[i]) done[i] = time;
        }
      return done.map((value, i) => criterion("p" + i, "P" + (i + 1) + " 완료 시각", value));
    }
    case "packet-pipeline":
      return [
        criterion("first", "첫 패킷의 마지막 비트 도착 시각 (ms)", p.times.reduce((a, b) => a + b, 0) + p.links * p.prop),
        criterion("interval", "목적지에서 패킷 도착 간격 (ms)", Math.max(...p.times)),
      ];
    case "dag-critical-path": {
      const finish = [];
      for (let i = 0; i < p.times.length; i++)
        finish[i] = Math.max(0, ...p.edges.filter(([, b]) => b === i).map(([a]) => finish[a])) + p.times[i];
      return [
        criterion("cstart", "작업 C의 최초 시작 시각", finish[2] - p.times[2]),
        criterion("dend", "작업 D의 최초 완료 시각", finish[3]),
        criterion("estart", "작업 E의 최초 시작 시각", finish[4] - p.times[4]),
      ];
    }
    default: return [];
  }
}

export function scoreReasoning(question, inputs = {}) {
  const criteria = reasoningCriteria(question);
  const safe = inputs && typeof inputs === "object" && !Array.isArray(inputs) ? inputs : {};
  const results = criteria.map((c) => {
    const raw = Object.hasOwn(safe, c.id) ? safe[c.id] : "";
    const valid = typeof raw === "string" && raw.length <= 40;
    const value = valid ? raw.trim() : "";
    return { ...c, value, attempted: valid && !!value, correct: valid && answerMatches(value, c.answer) };
  });
  return {
    total: results.length,
    attempted: results.filter((r) => r.attempted).length,
    earned: results.filter((r) => r.correct).length,
    results,
  };
}
