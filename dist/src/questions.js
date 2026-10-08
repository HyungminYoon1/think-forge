import { rng, shuffle } from "./core.js";
export const TOPICS = {
  numbers: { name: "수와 연산", subject: "math" },
  algebra: { name: "방정식·함수", subject: "math" },
  graphs: { name: "함수 그래프·점 선택", subject: "math" },
  geometry: { name: "도형·좌표", subject: "math" },
  probability: { name: "경우의 수·확률", subject: "math" },
  discrete: { name: "논리·집합·수열", subject: "math" },
  linear: { name: "벡터·행렬", subject: "math" },
  logic: { name: "진법·논리회로", subject: "cs" },
  code: { name: "코드 실행 추적", subject: "cs" },
  algorithms: { name: "자료구조·알고리즘", subject: "cs" },
  systems: { name: "운영체제·메모리", subject: "cs" },
  network: { name: "네트워크", subject: "cs" },
  database: { name: "데이터베이스·SQL", subject: "cs" },
  git: { name: "Git·버전 관리", subject: "cs" },
};
export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
function fraction(a, b) {
  const g = gcd(a, b);
  return a / g + "/" + b / g;
}
function choose(n, k) {
  let x = 1;
  for (let i = 1; i <= k; i++) x = (x * (n - i + 1)) / i;
  return Math.round(x);
}
export function answerMatches(input, answer) {
  if (typeof input !== "string" || !input.trim() || input.length > 80)
    return false;
  const clean = (s) =>
    String(s).trim().replace(/−/g, "-").replace(/\s+/g, "").toLowerCase();
  const parse = (s) => {
    const c = clean(s);
    if (/^-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?$/.test(c)) {
      const [a, b] = c.split("/").map(Number);
      return b ? a / b : NaN;
    }
    return /^-?\d+(?:\.\d+)?$/.test(c) ? Number(c) : NaN;
  };
  const a = parse(input),
    b = parse(answer);
  return Number.isFinite(a) && Number.isFinite(b)
    ? Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))
    : clean(input) === clean(answer);
}
export function makeQuestion(topic, level, seed, index = 0) {
  if (
    !TOPICS[topic] ||
    !Number.isInteger(level) ||
    level < 1 ||
    level > 4 ||
    typeof seed !== "string" ||
    seed.length > 40 ||
    !Number.isInteger(index) ||
    index < 0
  )
    throw new TypeError("Invalid question configuration");
  const r = rng(seed + "|" + topic + "|" + level + "|" + index),
    int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const q = (
    title,
    text,
    answer,
    hints,
    steps,
    options = null,
    visual = null,
    code = false,
  ) => ({
    title,
    text,
    answer: String(answer),
    hints,
    steps,
    options: options ? shuffle([...new Set(options.map(String))], r) : null,
    visual,
    code,
    topic,
    level,
    seed,
    index,
    id: topic + "-" + level + "-" + seed + "-" + index,
  });
  const numeric = (title, text, answer, hints, steps) =>
    q(title, text, answer, hints, steps, [
      answer,
      Number(answer) + 1,
      Number(answer) + 2,
      Math.max(0, Number(answer) - 1),
    ]);
  const a = int(2, 6 + level * 3),
    b = int(2, 6 + level * 3);
  switch (topic) {
    case "numbers":
      if (level === 1) {
        const operation = index % 3;
        if (operation === 0)
          return q(
            "두 수를 더해보세요.",
            a + " + " + b + " = ?",
            a + b,
            ["일의 자리부터 더해보세요."],
            [a + "와 " + b + "를 합칩니다.", "합은 " + (a + b) + "입니다."],
          );
        if (operation === 1)
          return q(
            "두 수를 곱해보세요.",
            a + " × " + b + " = ?",
            a * b,
            ["같은 수를 여러 번 더하는 계산입니다."],
            [a + "를 " + b + "번 더합니다.", "곱은 " + a * b + "입니다."],
          );
        return q(
          "빠진 수를 찾아보세요.",
          a + " + □ = " + (a + b),
          b,
          ["합에서 알고 있는 수를 빼세요."],
          [a + b + " − " + a + " = " + b],
        );
      }
      if (level === 2) {
        const d = int(3, 12),
          n1 = int(1, d - 1),
          n2 = int(1, d - 1);
        return q(
          "분수의 합을 구하세요.",
          n1 + "/" + d + " + " + n2 + "/" + d + " = ?",
          fraction(n1 + n2, d),
          ["분모가 같으면 분자끼리 더합니다.", "마지막에 약분하세요."],
          [
            "분자는 " + n1 + " + " + n2 + " = " + (n1 + n2),
            "합은 " + fraction(n1 + n2, d) + "입니다.",
          ],
        );
      }
      if (level === 3) {
        const g = gcd(a, b),
          l = (a * b) / g;
        return q(
          "최소공배수를 구하세요.",
          a + "와 " + b + "의 최소공배수는?",
          l,
          ["최대공약수와 두 수의 곱을 이용할 수 있습니다."],
          [
            "최대공약수 = " + g,
            "최소공배수 = (" + a + " × " + b + ") ÷ " + g + " = " + l,
          ],
        );
      }
      {
        const m = int(3, 11),
          power = int(2, 4),
          base = int(2, 8),
          v = base ** power;
        return q(
          "거듭제곱을 나눈 나머지는?",
          base + "^" + power + " 를 " + m + "로 나눈 나머지",
          v % m,
          [
            "먼저 거듭제곱을 계산해도 됩니다.",
            "배수보다 얼마나 남는지 확인하세요.",
          ],
          [
            base + "^" + power + " = " + v,
            v + " = " + m + " × " + Math.floor(v / m) + " + " + (v % m),
          ],
        );
      }
    case "algebra": {
      const x = int(-5, 12);
      if (level === 1)
        return q(
          "일차방정식의 x를 구하세요.",
          a + "x + " + b + " = " + (a * x + b),
          x,
          [
            "양변에서 " + b + "를 빼세요.",
            "그다음 양변을 " + a + "로 나누세요.",
          ],
          [a + "x = " + a * x, "x = " + x],
        );
      if (level === 2) {
        const y = int(1, 8),
          sum = x + y,
          diff = x - y;
        return q(
          "두 식을 동시에 만족하는 x는?",
          "x + y = " + sum + "\nx − y = " + diff,
          x,
          ["두 식을 더하면 y가 사라집니다."],
          ["2x = " + sum + " + (" + diff + ") = " + 2 * x, "x = " + x],
        );
      }
      if (level === 3) {
        const y = int(-8, 8);
        return q(
          "이차방정식의 두 근의 합은?",
          "(x − (" + x + "))(x − (" + y + ")) = 0",
          x + y,
          ["곱이 0이려면 적어도 한 인수가 0입니다."],
          [
            "두 근은 " + x + ", " + y + "입니다.",
            "합은 " + (x + y) + "입니다.",
          ],
        );
      }
      const at = int(1, 5);
      return q(
        "접선의 기울기를 구하세요.",
        "f(x) = " + a + "x² + " + b + "x\nx = " + at + " 에서 f′(x)는?",
        2 * a * at + b,
        ["x²을 미분하면 2x입니다.", "미분한 식에 x 값을 넣으세요."],
        [
          "f′(x) = " + 2 * a + "x + " + b,
          "f′(" + at + ") = " + (2 * a * at + b),
        ],
      );
    }
    case "graphs": {
      const coefficient = int(1, 2),
        offset = int(-3, 3),
        at = int(-2, 2);
      const fn = (x) =>
        level === 1
          ? coefficient * x + offset
          : level === 2
            ? coefficient * x * x + offset
            : level === 3
              ? coefficient * Math.abs(x) + offset
              : coefficient * x * x * x + offset;
      const formula =
        coefficient +
        (level === 1 ? "x" : level === 2 ? "x²" : level === 3 ? "|x|" : "x³") +
        " + (" +
        offset +
        ")";
      const y = fn(at),
        ys = shuffle([y, y + 4 + level * 2, y - 4 - level * 2], r);
      const points = ys.map((value, i) => ({
        x: at,
        y: value,
        label: String.fromCharCode(65 + i),
        value: String.fromCharCode(65 + i) + " (" + at + ", " + value + ")",
      }));
      const correct = points.find((point) => point.y === y).value;
      return q(
        "함수 위에 있는 점을 선택하세요.",
        "f(x) = " +
          formula +
          "\nx = " +
          at +
          "에서 함수 위의 점은? 그래프의 점이나 보기를 누르세요.",
        correct,
        ["주어진 x를 함수식에 대입하세요.", "계산한 y값과 같은 점을 찾으세요."],
        [
          "f(" + at + ") = " + y,
          "함수 위의 점은 (" + at + ", " + y + ")입니다.",
        ],
        points.map((point) => point.value),
        {
          type: "graph-choice",
          curve: Array.from({ length: 61 }, (_, i) => {
            const x = -3 + i / 10;
            return [x, fn(x)];
          }),
          points,
        },
      );
    }
    case "geometry":
      if (level === 1)
        return q(
          "직사각형의 넓이는?",
          "가로 " + a + " · 세로 " + b,
          a * b,
          ["가로와 세로를 곱하세요."],
          ["넓이 = " + a + " × " + b + " = " + a * b],
          null,
          { type: "rect", a, b },
        );
      if (level === 2)
        return q(
          "삼각형의 넓이는?",
          "밑변 " + 2 * a + " · 높이 " + b,
          a * b,
          ["같은 밑변과 높이를 가진 직사각형 넓이의 절반입니다."],
          ["넓이 = " + 2 * a + " × " + b + " ÷ 2 = " + a * b],
          null,
          { type: "triangle", a: 2 * a, b },
        );
      if (level === 3) {
        const k = int(1, 5);
        return q(
          "직각삼각형의 빗변 길이는?",
          "두 직각변의 길이: " + 3 * k + ", " + 4 * k,
          5 * k,
          ["피타고라스 정리를 이용하세요."],
          [
            "빗변² = " +
              (3 * k) ** 2 +
              " + " +
              (4 * k) ** 2 +
              " = " +
              (5 * k) ** 2,
            "빗변 = " + 5 * k,
          ],
          null,
          { type: "triangle", a: 3 * k, b: 4 * k },
        );
      }
      {
        const x = int(-4, 0),
          y = int(-3, 1),
          k = int(1, 2);
        return q(
          "두 점 사이의 거리를 구하세요.",
          "A(" +
            x +
            ", " +
            y +
            "), B(" +
            (x + 3 * k) +
            ", " +
            (y + 4 * k) +
            ")",
          5 * k,
          ["가로와 세로의 차이로 직각삼각형을 만드세요."],
          [
            "Δx = " + 3 * k + ", Δy = " + 4 * k,
            "거리 = √(" + 9 * k * k + " + " + 16 * k * k + ") = " + 5 * k,
          ],
          null,
          {
            type: "plot",
            points: [
              [x, y],
              [x + 3 * k, y + 4 * k],
            ],
          },
        );
      }
    case "probability":
      if (level === 1) {
        const limit = int(2, 5);
        return q(
          "주사위의 확률을 구하세요.",
          "공정한 6면 주사위에서 " + limit + " 이하가 나올 확률은?",
          fraction(limit, 6),
          ["가능한 결과 6개 중 조건에 맞는 결과를 세세요."],
          [
            "조건에 맞는 눈은 1부터 " + limit + "까지 " + limit + "개입니다.",
            "확률 = " + fraction(limit, 6),
          ],
        );
      }
      if (level === 2) {
        const red = int(2, 7),
          blue = int(2, 7);
        return q(
          "빨간 공을 뽑을 확률은?",
          "빨간 공 " +
            red +
            "개, 파란 공 " +
            blue +
            "개. 무작위로 공 1개를 뽑습니다.",
          fraction(red, red + blue),
          ["전체 공의 수가 분모입니다."],
          [
            "전체 = " + (red + blue) + "개",
            "확률 = " +
              red +
              "/" +
              (red + blue) +
              " = " +
              fraction(red, red + blue),
          ],
        );
      }
      if (level === 3) {
        const n = int(5, 10),
          k = int(2, 3);
        return q(
          "순서 없이 고르는 방법의 수는?",
          n + "명 중 " + k + "명을 뽑는 방법",
          choose(n, k),
          ["순서를 구분하지 않는 조합입니다."],
          [
            "조합 C(n, k) = n! / (k!(n−k)!)",
            "C(" + n + ", " + k + ") = " + choose(n, k),
          ],
        );
      }
      {
        const red = int(3, 8),
          blue = int(2, 7);
        return q(
          "앞의 결과를 알 때, 다음 확률은?",
          "빨간 공 " +
            red +
            "개, 파란 공 " +
            blue +
            "개. 첫 공이 빨간색이었고 되돌려 넣지 않았습니다. 두 번째도 빨간색일 확률은?",
          fraction(red - 1, red + blue - 1),
          ["남아 있는 빨간 공과 전체 공을 각각 1개씩 줄이세요."],
          [
            "남은 빨간 공 = " +
              (red - 1) +
              "개, 전체 = " +
              (red + blue - 1) +
              "개",
            "조건부 확률 = " + fraction(red - 1, red + blue - 1),
          ],
        );
      }
    case "discrete":
      if (level === 1) {
        const p = int(0, 1),
          s = int(0, 1);
        return q(
          "논리식의 값을 구하세요.",
          "p = " + p + ", q = " + s + "\n(p AND q) OR (NOT p)",
          (p && s) || !p ? 1 : 0,
          ["1은 참, 0은 거짓입니다.", "괄호 안부터 계산하세요."],
          [
            "p AND q = " + (p && s ? 1 : 0) + ", NOT p = " + (!p ? 1 : 0),
            "둘 중 하나라도 참이면 OR 결과는 1입니다.",
          ],
        );
      }
      if (level === 2) {
        const overlap = int(1, Math.min(a, b) - 1);
        return q(
          "합집합의 원소 수는?",
          "|A| = " + a + ", |B| = " + b + ", |A ∩ B| = " + overlap,
          a + b - overlap,
          ["겹친 원소가 두 번 세어지지 않게 빼세요."],
          [
            "|A ∪ B| = |A| + |B| − |A ∩ B|",
            "= " + a + " + " + b + " − " + overlap + " = " + (a + b - overlap),
          ],
        );
      }
      if (level === 3) {
        const n = int(5, 12),
          d = int(2, 6);
        return q(
          "등차수열의 합을 구하세요.",
          "첫째항 " + a + ", 공차 " + d + ". 첫 " + n + "개 항의 합은?",
          (n * (2 * a + (n - 1) * d)) / 2,
          ["마지막 항을 구한 뒤 양 끝 항의 평균을 이용하세요."],
          [
            "마지막 항 = " + (a + (n - 1) * d),
            "합 = " + n + " × (" + a + " + " + (a + (n - 1) * d) + ") ÷ 2",
          ],
        );
      }
      {
        const n = int(4, 10);
        return q(
          "완전그래프의 간선 수는?",
          "정점이 " + n + "개인 무방향 완전그래프 (자기 루프 없음)",
          (n * (n - 1)) / 2,
          ["모든 정점 쌍이 한 간선으로 연결됩니다."],
          [
            "정점 2개를 고르는 조합 C(n, 2)",
            "간선 수 = " + n + "(" + n + "−1) ÷ 2 = " + (n * (n - 1)) / 2,
          ],
        );
      }
    case "linear":
      if (level === 1) {
        const c = int(-4, 6),
          d = int(-4, 6);
        return q(
          "두 벡터의 내적을 구하세요.",
          "u = (" + a + ", " + b + "), v = (" + c + ", " + d + ")",
          a * c + b * d,
          ["같은 위치의 성분끼리 곱한 뒤 더합니다."],
          [
            "u·v = " + a + " × " + c + " + " + b + " × " + d,
            "= " + (a * c + b * d),
          ],
        );
      }
      if (level === 2) {
        const c = int(1, 7),
          d = int(1, 7);
        return q(
          "2×2 행렬의 행렬식은?",
          "A = [ " + a + "  " + b + " ]\n    [ " + c + "  " + d + " ]",
          a * d - b * c,
          ["ad − bc를 이용합니다."],
          [
            "det(A) = " + a + " × " + d + " − " + b + " × " + c,
            "= " + (a * d - b * c),
          ],
        );
      }
      if (level === 3) {
        const c = int(1, 6),
          d = int(1, 6);
        return q(
          "행렬 곱의 첫 번째 원소는?",
          "A = [ " +
            a +
            "  " +
            b +
            " ]    B = [ " +
            c +
            "  1 ]\n    [ 1  2 ]        [ " +
            d +
            "  2 ]\n(AB)의 1행 1열 값은?",
          a * c + b * d,
          ["A의 첫 행과 B의 첫 열을 내적합니다."],
          [
            "(AB)₁₁ = " + a + " × " + c + " + " + b + " × " + d,
            "= " + (a * c + b * d),
          ],
        );
      }
      {
        const x = int(1, 7),
          y = int(1, 7);
        return q(
          "연립방정식의 해 x는?",
          a + "x + y = " + (a * x + y) + "\nx + " + b + "y = " + (x + b * y),
          x,
          ["첫 식에서 y를 구해 두 번째 식에 대입하세요."],
          [
            "y = " + (a * x + y) + " − " + a + "x",
            "(1 − " + a * b + ")x = " + (x + b * y - b * (a * x + y)),
            "x = " + x,
          ],
        );
      }
    case "logic":
      if (level === 1) {
        const n = int(3, 15);
        return q(
          "이진수를 십진수로 바꾸세요.",
          n.toString(2) + "₂ = ?₁₀",
          n,
          ["오른쪽부터 1, 2, 4, 8의 자리입니다."],
          [
            "각 자리의 값에 비트를 곱해서 더합니다.",
            "십진수 값은 " + n + "입니다.",
          ],
        );
      }
      if (level === 2) {
        const n = int(17, 127);
        return q(
          "십진수를 이진수로 바꾸세요.",
          n + "₁₀ = ?₂",
          n.toString(2),
          ["2로 나누며 나머지를 아래에서 위로 읽습니다."],
          [
            "2의 거듭제곱 자리로 나누어 표현합니다.",
            "이진수 = " + n.toString(2),
          ],
          [
            n.toString(2),
            (n + 1).toString(2),
            (n + 2).toString(2),
            (n - 1).toString(2),
          ],
        );
      }
      if (level === 3) {
        const x = int(0, 15),
          y = int(0, 15);
        return numeric(
          "비트 XOR의 십진수 결과는?",
          x + " XOR " + y,
          x ^ y,
          ["서로 다른 비트는 1, 같은 비트는 0입니다."],
          [
            x.toString(2).padStart(4, "0") +
              " XOR " +
              y.toString(2).padStart(4, "0") +
              " = " +
              (x ^ y).toString(2).padStart(4, "0"),
            "십진수 = " + (x ^ y),
          ],
        );
      }
      {
        const n = int(3, 7);
        return q(
          "n비트의 서로 다른 상태 수는?",
          n + "비트로 표현할 수 있는 상태 개수",
          2 ** n,
          ["각 비트에는 0과 1 두 가지 선택이 있습니다."],
          ["상태 수 = 2^" + n + " = " + 2 ** n],
        );
      }
    case "code": {
      const n = int(3, 5 + level),
        step = int(1, 4),
        offset = int(0, 3);
      if (level <= 2)
        return q(
          "코드의 출력값을 예측하세요.",
          "// JavaScript\nlet sum = " +
            offset +
            ";\nfor (let i = 1; i <= " +
            n +
            "; i++) {\n  sum += i * " +
            step +
            ";\n}\nconsole.log(sum);",
          offset + ((n * (n + 1)) / 2) * step,
          [
            "반복문은 i = 1부터 " + n + "까지 실행됩니다.",
            "1부터 n까지의 합은 n(n+1)/2입니다.",
          ],
          [
            "합산 값 = " + (n * (n + 1)) / 2 + " × " + step,
            "처음 값 " +
              offset +
              "을 더하면 " +
              (offset + ((n * (n + 1)) / 2) * step),
          ],
          null,
          null,
          true,
        );
      if (level === 3) {
        const arr = Array.from({ length: 5 }, () => int(1, 12)),
          ans = arr.filter((x) => x % 2 === 0).reduce((s, x) => s + x, 0);
        return q(
          "배열 처리 결과를 예측하세요.",
          "// JavaScript\nconst data = [" +
            arr.join(", ") +
            "];\nconst out = data.filter(x => x % 2 === 0)\n  .reduce((sum, x) => sum + x, 0);\nconsole.log(out);",
          ans,
          ["filter는 짝수만 남깁니다.", "reduce는 남은 값을 합합니다."],
          [
            "남은 값: " + (arr.filter((x) => x % 2 === 0).join(", ") || "없음"),
            "합 = " + ans,
          ],
          null,
          null,
          true,
        );
      }
      const x = int(2, 4),
        y = int(2, 4);
      return q(
        "중첩 반복문의 실행 횟수는?",
        "// JavaScript\nlet count = 0;\nfor (let i = 0; i < " +
          x +
          "; i++)\n  for (let j = i; j < " +
          (x + y) +
          "; j++)\n    count++;\nconsole.log(count);",
        x * (x + y) - (x * (x - 1)) / 2,
        ["각 i마다 안쪽 반복 횟수가 하나씩 줄어듭니다."],
        [
          "횟수 = " +
            Array.from({ length: x }, (_, i) => x + y - i).join(" + "),
          "합 = " + (x * (x + y) - (x * (x - 1)) / 2),
        ],
        null,
        null,
        true,
      );
    }
    case "algorithms": {
      if (level === 1) {
        const list = Array.from({ length: 4 }, () => int(1, 20));
        return q(
          "스택에서 꺼내는 첫 값은?",
          "빈 스택에 " + list.join(", ") + " 순서로 push한 뒤 pop합니다.",
          list.at(-1),
          ["스택은 나중에 들어간 값이 먼저 나옵니다."],
          ["마지막으로 넣은 값 = " + list.at(-1), "pop 결과 = " + list.at(-1)],
          list,
        );
      }
      if (level === 2) {
        const n = 2 ** int(3, 7);
        return numeric(
          "반씩 줄이는 탐색의 단계 수는?",
          n +
            "개 후보를 매 단계 정확히 절반으로 줄입니다. 1개가 될 때까지 몇 단계인가요?",
          Math.log2(n),
          ["n ÷ 2 ÷ 2 ... 를 생각하세요."],
          ["2^k = " + n, "k = " + Math.log2(n)],
        );
      }
      if (level === 3) {
        const n = int(4, 10);
        return q(
          "모든 쌍을 비교하는 횟수는?",
          "n = " +
            n +
            "일 때, 0 ≤ i < j < n인 모든 (i, j)를 한 번씩 비교합니다.",
          (n * (n - 1)) / 2,
          ["중복 없는 두 원소의 조합입니다."],
          ["비교 횟수 = n(n−1)/2", "= " + (n * (n - 1)) / 2],
        );
      }
      const n = int(5, 10);
      return q(
        "연결된 트리의 간선 수는?",
        "정점이 " + n + "개이고 사이클이 없는 연결 무방향 그래프",
        n - 1,
        ["트리에 새 정점을 하나 붙일 때 간선 하나가 필요합니다."],
        ["트리의 간선 수 = 정점 수 − 1", "= " + (n - 1)],
      );
    }
    case "systems":
      if (level === 1)
        return q(
          "프로세스와 스레드에 대한 올바른 설명은?",
          "일반적인 운영체제 모델을 기준으로 고르세요.",
          "같은 프로세스의 스레드는 주소 공간을 공유한다",
          ["스레드는 프로세스 내부의 실행 흐름입니다."],
          [
            "같은 프로세스의 스레드는 코드·힙 등 주소 공간을 공유합니다.",
            "각 스레드는 자신의 실행 스택과 레지스터 상태를 가집니다.",
          ],
          [
            "같은 프로세스의 스레드는 주소 공간을 공유한다",
            "서로 다른 프로세스는 항상 같은 힙을 공유한다",
            "각 스레드는 항상 별도의 전체 주소 공간을 가진다",
            "프로세스와 스레드는 완전히 같은 개념이다",
          ],
        );
      if (level === 2) {
        const pages = int(3, 20),
          size = 2 ** int(10, 13);
        return q(
          "페이지들이 차지하는 바이트 수는?",
          "페이지 크기 " + size + "바이트, 페이지 " + pages + "개",
          pages * size,
          ["페이지 개수와 페이지 크기를 곱합니다."],
          ["총 바이트 = " + pages + " × " + size, "= " + pages * size],
        );
      }
      {
        const cap = level === 3 ? 2 : 3,
          refs = Array.from({ length: level === 3 ? 6 : 9 }, () => int(1, 5)),
          queue = [];
        let faults = 0;
        const notes = [];
        for (const n of refs) {
          if (!queue.includes(n)) {
            faults++;
            if (queue.length === cap) queue.shift();
            queue.push(n);
            notes.push(n + ": 부재 → [" + queue.join(",") + "]");
          } else notes.push(n + ": 적중");
        }
        return q(
          "FIFO 페이지 부재 횟수는?",
          "처음에는 빈 프레임 " +
            cap +
            "개. 적중 시 순서를 바꾸지 않습니다.\n참조 순서: " +
            refs.join(" → "),
          faults,
          [
            "프레임에 없는 페이지를 읽을 때 부재가 발생합니다.",
            "가장 먼저 들어온 페이지부터 교체합니다.",
          ],
          notes,
        );
      }
    case "network":
      if (level === 1)
        return q(
          "도메인의 IP 주소를 찾는 역할은?",
          "브라우저에서 도메인 이름을 사용합니다.",
          "DNS",
          ["사람이 읽는 이름을 네트워크 주소에 대응시킵니다."],
          [
            "DNS는 이름에 대응하는 IP 주소 등 레코드를 조회합니다.",
            "TLS는 암호화 연결, HTTP는 요청·응답을 다룹니다.",
          ],
          ["DNS", "TLS", "HTML", "CSS"],
        );
      if (level === 2)
        return q(
          "일반적인 HTTP 성공 상태 코드는?",
          "요청이 성공하여 정상 응답을 반환했습니다.",
          "200",
          ["상태 코드의 첫 자리 2는 성공 계열입니다."],
          [
            "200 OK는 정상 성공 응답입니다.",
            "404는 찾을 수 없음, 500은 서버 내부 오류입니다.",
          ],
          ["200", "404", "500", "403"],
        );
      {
        const prefix = level === 3 ? int(25, 29) : int(24, 30),
          count = 2 ** (32 - prefix) - 2;
        return q(
          "IPv4 서브넷의 일반 호스트 주소 수는?",
          "/" +
            prefix +
            " 서브넷. 네트워크 주소와 브로드캐스트 주소는 제외합니다.",
          count,
          ["호스트 비트 수는 32 − 접두 길이입니다."],
          [
            "호스트 비트 = " + (32 - prefix),
            "전체 주소 2^" + (32 - prefix) + "개에서 2개 제외",
            "사용 가능한 일반 호스트 주소 = " + count,
          ],
        );
      }
    case "database": {
      const rows = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          score: int(30, 100),
        })),
        threshold = int(50, 80);
      const filtered = rows.filter((x) => x.score >= threshold);
      const table = {
        type: "table",
        head: ["id", "score"],
        rows: rows.map((x) => [x.id, x.score]),
      };
      if (level === 1)
        return q(
          "WHERE 조건을 만족하는 행은 몇 개인가요?",
          "SELECT * FROM scores\nWHERE score >= " + threshold + ";",
          filtered.length,
          ["각 행의 score를 조건과 비교합니다."],
          [
            "조건을 만족하는 id: " +
              (filtered.map((x) => x.id).join(", ") || "없음"),
            "행 수 = " + filtered.length,
          ],
          null,
          table,
          true,
        );
      if (level === 2)
        return q(
          "SQL 집계 결과를 구하세요.",
          "SELECT SUM(score) FROM scores\nWHERE score >= " + threshold + ";",
          filtered.length ? filtered.reduce((s, x) => s + x.score, 0) : "NULL",
          [
            "조건에 맞는 값들만 더합니다.",
            "대상이 없으면 SQL SUM은 NULL입니다.",
          ],
          [
            "대상 값: " + (filtered.map((x) => x.score).join(", ") || "없음"),
            "결과 = " +
              (filtered.length
                ? filtered.reduce((s, x) => s + x.score, 0)
                : "NULL"),
          ],
          [
            "NULL",
            filtered.length ? filtered.reduce((s, x) => s + x.score, 0) : 0,
            filtered.reduce((s, x) => s + x.score, 0) + 10,
            filtered.reduce((s, x) => s + x.score, 0) + 20,
          ],
          table,
          true,
        );
      if (level === 3) {
        const ids = shuffle([1, 2, 3, 4, 5], r).slice(0, 3);
        return q(
          "INNER JOIN 결과의 행 수는?",
          "A의 id: 1, 2, 3, 4, 5\nB의 id: " +
            ids.join(", ") +
            "\nA INNER JOIN B ON A.id = B.id\n각 id는 각 테이블에서 유일합니다.",
          3,
          ["양쪽에 존재하는 id만 결합합니다."],
          [
            "공통 id는 " + ids.join(", ") + "입니다.",
            "각각 한 행씩 매칭되어 3행입니다.",
          ],
        );
      }
      return q(
        "기본키의 조건으로 알맞은 것은?",
        "관계형 테이블의 PRIMARY KEY",
        "유일하며 NULL을 허용하지 않는다",
        ["행을 구분할 수 있어야 합니다."],
        [
          "기본키는 행을 유일하게 식별합니다.",
          "중복 및 NULL을 허용하지 않습니다.",
        ],
        [
          "유일하며 NULL을 허용하지 않는다",
          "중복된 값이어도 된다",
          "반드시 문자열이어야 한다",
          "항상 여러 행에서 같아야 한다",
        ],
      );
    }
    case "git": {
      const pool = [
        [
          "git commit이 기본적으로 기록하는 것은?",
          "수정한 파일 일부만 git add한 상태입니다.",
          "스테이징된 내용",
          "커밋은 인덱스의 스냅샷을 기록합니다.",
          [
            "스테이징된 내용",
            "모든 미추적 파일",
            "원격 저장소의 최신 파일",
            "작업 폴더의 모든 변경",
          ],
        ],
        [
          "공유한 변경을 기록을 남기며 취소하려면?",
          "이미 푸시한 일반 커밋의 변경을 취소하려고 합니다.",
          "git revert",
          "revert는 기존 기록을 유지하고 취소 커밋을 만듭니다.",
          ["git revert", "git reset --hard", "git init", "git stash"],
        ],
        [
          "작업 폴더와 인덱스를 유지하며 브랜치 위치만 옮기는 옵션은?",
          "로컬 커밋을 다시 정리하려고 합니다.",
          "git reset --soft",
          "--soft는 HEAD만 이동하고 인덱스·작업 트리는 유지합니다.",
          [
            "git reset --soft",
            "git reset --hard",
            "git clean -fd",
            "git fetch",
          ],
        ],
        [
          "원격 추적 정보를 가져오지만 현재 브랜치를 자동 병합하지 않는 명령은?",
          "우선 원격 변경을 확인하려고 합니다.",
          "git fetch",
          "fetch는 원격 객체·추적 정보를 가져옵니다. 병합은 별도입니다.",
          ["git fetch", "git pull", "git commit", "git merge"],
        ],
      ];
      const v = pool[level - 1];
      return q(v[0], v[1], v[2], [v[3]], [v[3]], v[4]);
    }
    default:
      throw Error("Unsupported topic");
  }
}
