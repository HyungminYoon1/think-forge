import { question as q, frac, choose, factorial, sum } from "./exam-utils.js";
import { source } from "./sources.js";

// Each entry is a distinct reasoning family, not an operand/label variant.
export const MATH = [
  {
    id: "crt",
    topic: "numbers",
    build: (r, l) => {
      const n = r(10, 24),
        a = n % 5,
        b = n % 7,
        hi = 70 + r(1, 5) * 7;
      const xs = Array.from({ length: hi }, (_, i) => i + 1).filter(
        (x) => x % 5 === a && x % 7 === b,
      );
      return q(
        "나머지 조건을 동시에 만족하는 수",
        `양의 정수 x에 대해 x ≡ ${a} (mod 5), x ≡ ${b} (mod 7).\n${l <= 2 ? "가장 작은 x는?" : `x ≤ ${hi}인 모든 x의 합은?`}`,
        l <= 2 ? n : sum(xs),
        [
          "한 합동식의 후보를 다른 합동식에 대입합니다.",
          `최소해는 ${n}. 5와 7이 서로소이므로 모든 해는 ${n}+35k입니다.`,
          l <= 2
            ? `최소 양의 해: ${n}`
            : `범위 안의 해 ${xs.join(", ")}를 더하면 ${sum(xs)}.`,
        ],
        { params: { n, hi } },
      );
    },
  },
  {
    id: "divisibility",
    topic: "numbers",
    build: (r, l) => {
      const n = r(80, 160),
        a = 3,
        b = 5,
        c = 7;
      const xs = Array.from({ length: n }, (_, i) => i + 1).filter((x) =>
        l <= 2
          ? (x % a === 0) !== (x % b === 0)
          : [a, b, c].filter((d) => x % d === 0).length === 1,
      );
      return q(
        "정확히 하나의 배수 조건",
        `1부터 ${n}까지의 정수 중 ${l <= 2 ? "3, 5" : "3, 5, 7"} 중 정확히 하나로만 나누어떨어지는 수의 개수는?`,
        xs.length,
        [
          "교집합에 들어간 수가 몇 번 세어졌는지 확인합니다.",
          l <= 2
            ? "⌊N/3⌋+⌊N/5⌋−2⌊N/15⌋."
            : "단일 배수 개수의 합 − 2×쌍별 공배수 개수의 합 + 3×세 수의 공배수 개수.",
          `N=${n}을 대입하면 ${xs.length}개.`,
        ],
        { params: { n } },
      );
    },
  },
  {
    id: "integer-solutions",
    topic: "numbers",
    build: (r, l) => {
      const n = r(28, 45),
        cap = r(3, 6),
        xs = [];
      for (let x = 0; x <= n / 3; x++)
        for (let y = 0; y <= n / 5; y++)
          if (3 * x + 5 * y === n && (l <= 2 || x + y >= cap + 5))
            xs.push([x, y]);
      return q(
        "정수 제약과 해의 개수",
        `0 이상의 정수 x,y에 대해 3x+5y=${n}.${l <= 2 ? "" : ` 또한 x+y≥${cap + 5}.`} 순서쌍 (x,y)는 몇 개인가?`,
        xs.length,
        [
          "식의 양변을 3으로 나눈 나머지로 y의 후보를 제한합니다.",
          `0≤y≤${Math.floor(n / 5)}이고 x=(${n}−5y)/3입니다.`,
          `조건을 통과한 해: ${xs.map((v) => `(${v})`).join(", ") || "없음"}. 총 ${xs.length}개.`,
        ],
        { params: { n, cap } },
      );
    },
  },
  {
    id: "quadratic-roots",
    topic: "algebra",
    build: (r, l) => {
      const a = r(1, 4),
        b = a + r(1, 4),
        s = a + b,
        p = a * b;
      return q(
        "근과 계수에서 대칭식으로",
        `방정식 x²−${s}x+${p}=0의 두 근을 α,β라 한다.\n${l <= 2 ? "α²+β²" : "α³+β³−αβ(α+β)"}의 값은?`,
        l <= 2 ? s * s - 2 * p : s ** 3 - 4 * p * s,
        [
          "α+β와 αβ를 먼저 구합니다.",
          `α+β=${s}, αβ=${p}.`,
          l <= 2
            ? `(α+β)²−2αβ=${s * s - 2 * p}.`
            : `α³+β³=(α+β)³−3αβ(α+β)이므로 답은 ${s ** 3 - 4 * p * s}.`,
        ],
        { params: { a, b } },
      );
    },
  },
  {
    id: "composition",
    topic: "algebra",
    build: (r, l) => {
      const a = r(2, 4),
        b = r(1, 5),
        x = r(1, 4),
        c = a * b + b;
      return q(
        "합성함수에서 원래 함수 복원",
        `일차함수 f(x)=ax+b에서 a>0이고 f(f(x))=${a * a}x+${c}이다.\n${l <= 2 ? `f(${x})` : `f⁻¹(${a * x + b})+f(${x + 1})`}의 값은?`,
        l <= 2 ? a * x + b : x + a * (x + 1) + b,
        [
          "합성하면 f(f(x))=a²x+b(a+1)입니다.",
          `a=${a}, b=${c}/(${a}+1)=${b}.`,
          l <= 2
            ? `f(${x})=${a * x + b}.`
            : `역함수 값은 ${x}, 함수 값은 ${a * (x + 1) + b}, 합은 ${x + a * (x + 1) + b}.`,
        ],
        { params: { a, b, x } },
      );
    },
  },
  {
    id: "absolute-roots",
    topic: "algebra",
    build: (r, l) => {
      const a = r(1, 4),
        b = a + r(2, 5),
        extra = r(1, 4),
        k = b - a + 2 * extra;
      return q(
        "절댓값 방정식의 구간 분리",
        `|x−${a}|+|x−${b}|=${k}의 실근을 α<β라 한다.\n${l <= 2 ? "β−α" : "α²+β²"}의 값은?`,
        l <= 2 ? k : (a - extra) ** 2 + (b + extra) ** 2,
        [
          "x<a, a≤x≤b, x>b로 나누어 봅니다.",
          `가운데 구간의 값 ${b - a}는 우변보다 작습니다. 양쪽에서 α=${a - extra}, β=${b + extra}.`,
          `요구한 값은 ${l <= 2 ? k : (a - extra) ** 2 + (b + extra) ** 2}.`,
        ],
        { params: { a, b, extra } },
      );
    },
  },
  {
    id: "cubic-extrema",
    topic: "graphs",
    build: (r, l) => {
      const a = r(1, 3),
        c = r(-3, 3);
      return q(
        "도함수 부호와 극값",
        `f(x)=x³−${3 * a * a}x+(${c}).\n${l <= 2 ? "극댓값과 극솟값의 차" : `−${2 * a}≤x≤${a}에서 f(x)의 최댓값과 최솟값의 차`}는?`,
        4 * a ** 3,
        [
          "f′(x)=3(x−a)(x+a)의 부호를 조사합니다.",
          `x=−${a}에서 극대 ${c + 2 * a ** 3}, x=${a}에서 극소 ${c - 2 * a ** 3}.`,
          l <= 2
            ? `극값 차는 ${4 * a ** 3}.`
            : `닫힌 구간의 양 끝도 확인합니다. f(−${2 * a})=${c - 2 * a ** 3}; 범위의 폭은 ${4 * a ** 3}.`,
        ],
        { params: { a, c } },
      );
    },
  },
  {
    id: "rational-range",
    topic: "graphs",
    build: (r, l) => {
      const a = r(1, 4),
        scale = r(1, 3);
      return q(
        "유리함수의 치역과 교점",
        `f(x)=${2 * a * scale}x/(x²+${a * a}).\n${l <= 2 ? "실수 전체에서 최댓값은?" : `방정식 f(x)=k가 서로 다른 두 실근을 갖는 정수 k는 몇 개인가?`}`,
        l <= 2 ? scale : 2 * (scale - 1),
        [
          "분모는 항상 양수이며 도함수의 분자는 a²−x²에 비례합니다.",
          `최댓값 ${scale}, 최솟값 −${scale}.`,
          l <= 2
            ? `x=${a}에서 최댓값 ${scale}.`
            : `−${scale}<k<${scale}이며 k≠0이어야 이차방정식의 서로 다른 두 해가 생깁니다. 따라서 ${2 * (scale - 1)}개.`,
        ],
        {
          params: { a, scale },
          source: source(
            "calculus",
            "Problem 4",
            "유리함수의 가로·세로 배율 변경, 치역 및 정수 매개변수의 교점 개수로 질문 변경.",
          ),
        },
      );
    },
  },
  {
    id: "line-parabola",
    topic: "graphs",
    build: (r, l) => {
      const a = r(1, 4),
        t = r(1, 4),
        b = r(-3, 3),
        c = t * t - a * a + b;
      return q(
        "직선과 포물선의 교점 조건",
        l <= 2
          ? `포물선 y=(x−${a})²+(${b})와 수평선 y=${b + t * t}의 교점을 A,B라 한다. 두 교점의 x좌표의 곱은?`
          : `직선 y=${2 * a}x+k가 포물선 y=x²+(${c})에 접할 때 k는?`,
        l <= 2 ? a * a - t * t : c - a * a,
        [
          l <= 2
            ? "완전제곱을 풀어 두 x좌표를 얻습니다."
            : "접한다는 것은 두 식을 정리한 이차방정식의 판별식이 0이라는 뜻입니다.",
          l <= 2
            ? `x=${a - t}, ${a + t}. 곱은 ${a * a - t * t}.`
            : `x²−${2 * a}x+(${c}−k)=0. 판별식 4×${a * a}−4(${c}−k)=0이므로 k=${c - a * a}.`,
        ],
        { params: { a, t, b, c } },
      );
    },
  },
  {
    id: "chord",
    topic: "geometry",
    build: (r, l) => {
      const k = r(1, 3),
        d = 3 * k,
        radius = 5 * k;
      return q(
        "원의 현과 중심 거리",
        `반지름 ${radius}인 원의 중심 O에서 현 AB까지의 거리는 ${d}이다.\n${l <= 2 ? "삼각형 OAB의 넓이" : "현 AB와 평행하고 길이가 AB와 같은 다른 현 CD에 대해 사각형 ACDB의 넓이 (A,C 및 B,D가 각각 같은 쪽 끝점)"}는?`,
        l <= 2 ? 12 * k * k : 48 * k * k,
        [
          "중심에서 현에 내린 수선은 현을 이등분합니다.",
          `현의 절반은 √(${radius ** 2}−${d ** 2})=${4 * k}, 현 길이는 ${8 * k}.`,
          l <= 2
            ? `삼각형 넓이=${8 * k}×${d}/2=${12 * k * k}.`
            : `다른 현은 중심 반대편 거리 ${d}에 있습니다. 직사각형 넓이=${8 * k}×${2 * d}=${48 * k * k}.`,
        ],
        { params: { k } },
      );
    },
  },
  {
    id: "reflection-path",
    topic: "geometry",
    build: (r, l) => {
      const k = r(1, 3),
        h = r(1, 3),
        y1 = h * k,
        y2 = (4 - h) * k;
      return q(
        "반사로 찾는 최단 경로",
        `A=(0,${y1}), B=(${3 * k},${y2}), P=(t,0)이고 t는 실수이다.\n${l <= 2 ? "AP+PB의 최솟값" : "AP+PB가 최소일 때 t"}은?`,
        l <= 2 ? 5 * k : frac(3 * h * k, 4),
        [
          "A를 x축에 대칭이동한 A′와 B를 직선으로 연결합니다.",
          `수평 차는 ${3 * k}, 수직 차는 ${4 * k}; 최단 길이는 ${5 * k}.`,
          `교점은 높이 비 ${h}: ${4 - h}로 나누므로 t=${frac(3 * h * k, 4)}.`,
        ],
        { params: { k, h } },
      );
    },
  },
  {
    id: "triangle-section",
    topic: "geometry",
    build: (r, l) => {
      const a = r(2, 5),
        b = r(2, 5),
        m = r(1, 3),
        n = r(2, 4),
        area = 2 * a * b;
      return q(
        "내분점과 넓이비",
        `A=(0,0), B=(${2 * a},0), C=(0,${2 * b}). D는 BC를 BD:DC=${m}:${n}으로 내분한다. E는 AC의 중점이다.\n${l <= 2 ? "삼각형 ABD" : "삼각형 ADE"}의 넓이는?`,
        l <= 2 ? frac(area * m, m + n) : frac(area * n, 2 * (m + n)),
        [
          "같은 높이를 갖는 삼각형의 넓이비는 밑변의 비입니다.",
          `ABC 넓이는 ${area}. ABD는 ABC의 ${m}/${m + n}.`,
          l <= 2
            ? `ABD=${frac(area * m, m + n)}.`
            : `ACD는 ABC의 ${n}/${m + n}; AE=AC/2이므로 ADE=${frac(area * n, 2 * (m + n))}.`,
        ],
        { params: { a, b, m, n } },
      );
    },
  },
  {
    id: "bayes",
    topic: "probability",
    build: (r, l) => {
      const prior = r(1, 4),
        hit = r(7, 9),
        falseAlarm = r(1, 4),
        repeat = l >= 3 ? 2 : 1;
      const num = prior * hit ** repeat * 10 ** repeat,
        other = (100 - prior) * falseAlarm ** repeat;
      return q(
        "탐지 신호 뒤의 조건부 확률",
        `불량 센서 모듈 비율은 ${prior}/100. 불량이면 경고 확률 ${hit}/10, 정상이면 경고 확률 ${falseAlarm}/100이다.\n${repeat === 1 ? "한 번 경고가 나왔다." : "동일 모듈을 두 번 검사했으며 두 번 모두 경고가 났다. 불량 여부가 주어지면 두 검사 결과는 조건부 독립이다."} 이 모듈이 불량일 확률은? (분수)`,
        frac(num, num + other),
        [
          "불량이면서 경고인 경우와 정상이면서 경고인 경우를 구분합니다.",
          `분자=(불량 사전확률)×(불량일 때 경고 확률)^${repeat}.`,
          `분모에 정상에서의 경고 확률까지 합쳐 정규화하면 ${frac(num, num + other)}.`,
        ],
        {
          params: { prior, hit, falseAlarm, repeat },
          source: source(
            "discrete",
            "Problem 3",
            "의료 맥락을 센서 검사로 바꾸고 비율 및 반복 검사 조건을 변경.",
          ),
        },
      );
    },
  },
  {
    id: "dice-pattern",
    topic: "probability",
    build: (r, l) => {
      const faces = r(5, 8),
        pattern = l === 1 ? "distinct" : l === 2 ? "pair" : "two-pairs";
      const ways =
        pattern === "distinct"
          ? factorial(5) * choose(faces, 5)
          : pattern === "pair"
            ? faces * choose(faces - 1, 3) * 60
            : choose(faces, 2) * (faces - 2) * 30;
      return q(
        "다섯 주사위의 중복 패턴",
        `1~${faces}가 같은 확률로 나오는 주사위 5개를 독립적으로 던진다.\n${pattern === "distinct" ? "모든 눈이 서로 다를" : pattern === "pair" ? "정확히 한 쌍만 같고 나머지 세 눈은 서로 다르며 쌍의 눈과도 다를" : "서로 다른 두 쌍과 그 두 눈과 다른 한 개의 눈이 나올"} 확률은?`,
        frac(ways, faces ** 5),
        [
          "눈의 종류를 고르는 경우와 다섯 위치에 배치하는 경우를 분리합니다.",
          pattern === "distinct"
            ? "C(f,5)·5!"
            : pattern === "pair"
              ? "f·C(f−1,3)·5!/2!"
              : "C(f,2)·(f−2)·5!/(2!2!) — 두 쌍의 순서를 또 세지 않습니다.",
          `유리한 경우 ${ways} / 전체 ${faces ** 5} = ${frac(ways, faces ** 5)}.`,
        ],
        {
          params: { faces, pattern },
          source: source(
            "discrete",
            "Problem 4(a–c)",
            "주사위 면 수와 질문 패턴을 변경; 조합 계수와 배치를 한국어로 설명.",
          ),
        },
      );
    },
  },
  {
    id: "adjacent-expectation",
    topic: "probability",
    build: (r, l) => {
      const n = r(3, 6),
        m = r(2, 4),
        circular = l >= 3,
        N = n * m;
      return q(
        "인접 일치 쌍의 기댓값",
        `서로 다른 라벨 ${n}종류가 각각 ${m}장씩 있는 카드 ${N}장을 무작위로 섞어 ${circular ? "원형으로" : "한 줄로"} 놓는다. ${circular ? "마지막과 첫 카드도 인접하며 각 경계는 한 번씩 센다." : "양 끝은 인접하지 않는다."}\n인접한 두 카드의 라벨이 같은 경계 개수의 기댓값은?`,
        circular ? frac(N * (m - 1), N - 1) : m - 1,
        [
          "각 경계가 일치하면 1인 지시변수를 둡니다. 경계들 사이의 독립성은 필요하지 않습니다.",
          `한 경계의 일치 확률은 (${m}−1)/(${N}−1).`,
          `기댓값의 선형성으로 ${circular ? N : N - 1}개 경계의 확률을 더하면 ${circular ? frac(N * (m - 1), N - 1) : m - 1}.`,
        ],
        {
          params: { n, m, circular },
          source: source(
            "discrete",
            "Problem 7",
            "라벨·복사본 수 일반화, 상위 단계에 원형 인접 조건 추가.",
          ),
        },
      );
    },
  },
  {
    id: "sequence-inference",
    topic: "discrete",
    build: (r, l) => {
      const a = r(1, 5),
        d = r(1, 4),
        n = r(6, 10),
        s3 = 3 * a + 3 * d,
        s5 = 5 * a + 10 * d;
      return q(
        "부분합에서 수열 복원",
        `등차수열의 첫 n항의 합을 Sₙ이라 한다. S₃=${s3}, S₅=${s5}.\n${l <= 2 ? `S${n}` : `Σ(k=1..${n}) (aₖ+aₖ₊₁)`}의 값은?`,
        l <= 2 ? (n * (2 * a + (n - 1) * d)) / 2 : n * (2 * a + n * d),
        [
          "S₃=3a₁+3d, S₅=5a₁+10d를 연립합니다.",
          `a₁=${a}, d=${d}.`,
          l <= 2
            ? `S${n}=${(n * (2 * a + (n - 1) * d)) / 2}.`
            : `각 항 aₖ+aₖ₊₁=2a₁+(2k−1)d를 합하면 ${n * (2 * a + n * d)}.`,
        ],
        { params: { a, d, n } },
      );
    },
  },
  {
    id: "telescoping",
    topic: "discrete",
    build: (r, l) => {
      const n = r(5, 10),
        c = r(1, 4);
      return q(
        "분수 수열의 소거",
        `aₖ=${c}/(k(k+1)).\n${l <= 2 ? `Σ(k=1..${n}) aₖ` : `Σ(k=1..${n}) (k+1)aₖ − Σ(k=2..${n}) ${c}/k`}의 값은?`,
        l <= 2 ? frac(c * n, n + 1) : c,
        [
          l <= 2
            ? "1/(k(k+1))=1/k−1/(k+1)로 나눕니다."
            : "(k+1)aₖ=c/k로 약분한 뒤 두 합의 범위를 비교합니다.",
          l <= 2
            ? `가운데 항이 사라져 ${c}(1−1/${n + 1})=${frac(c * n, n + 1)}.`
            : `k=2부터 ${n}까지 모두 소거되어 k=1의 ${c}만 남습니다.`,
        ],
        { params: { n, c } },
      );
    },
  },
  {
    id: "pigeonhole-buttons",
    topic: "discrete",
    build: (r, l) => {
      const buttons = r(3, 5),
        states = r(30, 90),
        n = r(4, 6);
      let minimum = 1;
      while (buttons * (buttons - 1) ** (minimum - 1) <= states) minimum++;
      return q(
        "조작열과 비둘기집 원리",
        `버튼 ${buttons}개를 누르며 바로 앞 버튼은 연속해서 누를 수 없다. 시작 상태는 고정이고 조작은 결정적이다. 가능한 최종 상태는 최대 ${states}개다.\n${l <= 2 ? `${n}번 누르는 서로 다른 조작열 수는?` : "서로 다른 두 조작열이 같은 최종 상태가 됨을 개수 비교만으로 보장하는 최소 길이 n은? (길이가 같은 조작열끼리 비교)"}`,
        l <= 2 ? buttons * (buttons - 1) ** (n - 1) : minimum,
        [
          "첫 버튼은 b가지, 이후는 b−1가지이므로 길이 n의 조작열은 b(b−1)^(n−1)개입니다.",
          l <= 2
            ? `따라서 ${buttons * (buttons - 1) ** (n - 1)}개.`
            : `조작열 수가 상태 상한 ${states}보다 엄격히 커야 보장됩니다. n=${minimum - 1}에서는 충분하지 않고 n=${minimum}에서는 초과합니다.`,
          "같은 조작열이 반복된다는 주장과 서로 다른 조작열의 최종 상태가 같다는 주장은 다릅니다.",
        ],
        {
          params: { buttons, states, n },
          source: source(
            "discrete",
            "Problem 5",
            "색 배치의 상태 개수 대신 유한 상태 상한을 제시하고 최소 길이 역추론으로 변경.",
          ),
        },
      );
    },
  },
  {
    id: "projection",
    topic: "linear",
    build: (r, l) => {
      const a = r(1, 4),
        b = r(1, 5),
        u = [1, 2],
        v = [a, b],
        dot = a + 2 * b;
      return q(
        "정사영과 직교 잔차",
        `u=(1,2), v=(${a},${b}). v=tu+w이고 w·u=0이다.\n${l <= 2 ? "t" : "w·w"}의 값은?`,
        l <= 2 ? frac(dot, 5) : frac(5 * (a * a + b * b) - dot * dot, 5),
        [
          "양변을 u와 내적하면 t=(v·u)/(u·u)입니다.",
          `t=${frac(dot, 5)}.`,
          `직교분해로 ||w||²=||v||²−(v·u)²/||u||²=${frac(5 * (a * a + b * b) - dot * dot, 5)}.`,
        ],
        { params: { u, v } },
      );
    },
  },
  {
    id: "matrix-composition",
    topic: "linear",
    build: (r, l) => {
      const a = r(1, 4),
        x = r(1, 4),
        y = r(1, 4);
      return q(
        "선형변환의 적용 순서",
        `S(x,y)=(x+${a}y,y), R(x,y)=(−y,x). v=(${x},${y}).\n${l <= 2 ? "R(S(v))의 두 성분의 합" : "S(R(v))−R(S(v))의 두 성분의 합"}은?`,
        l <= 2 ? x + (a - 1) * y : a * (x - y),
        [
          "합성은 안쪽 변환부터 적용합니다.",
          `R(S(v))=(−${y},${x + a * y}), S(R(v))=(${a * x - y},${x}).`,
          `요구한 성분 합은 ${l <= 2 ? x + (a - 1) * y : a * (x - y)}. 일반적으로 변환 순서를 교환할 수 없습니다.`,
        ],
        { params: { a, x, y } },
      );
    },
  },
  {
    id: "singular-system",
    topic: "linear",
    build: (r, l) => {
      const a = r(2, 5),
        b = r(1, 5),
        c = r(1, 5);
      return q(
        "특이행렬과 해의 존재",
        `연립식 x+${a}y=${b}, ${a}x+ky=${l <= 2 ? a * b : a * b + c}.\n${l <= 2 ? "해가 무수히 많아지는 k" : "해가 존재하지 않는 k"}는?`,
        a * a,
        [
          "둘째 식에서 첫째 식의 a배를 빼면 (k−a²)y=우변의 차입니다.",
          l <= 2
            ? `k=${a * a}일 때 두 식이 같아 자유변수가 남습니다.`
            : `k=${a * a}일 때 0=${c}가 되어 모순입니다. 다른 k에서는 유일해가 있습니다.`,
        ],
        { params: { a, b, c } },
      );
    },
  },
  {
    id: "poster-optimum",
    topic: "calculus",
    build: (r, l) => {
      const h = r(1, 3) * 2,
        v = r(1, 3) * 2,
        t = r(2, 5),
        area = h * v * t * t,
        x = h * t,
        y = v * t;
      return q(
        "여백이 있는 인쇄물의 최소 넓이",
        `인쇄 영역은 가로 x>0, 세로 y>0인 직사각형이며 xy=${area}. 좌우 여백은 각각 ${h / 2}, 위아래 여백은 각각 ${v / 2}이다.\n${l <= 2 ? "전체 종이 넓이가 최소일 때 인쇄 영역의 가로 x" : "전체 종이 넓이의 최솟값"}는?`,
        l <= 2 ? x : (x + h) * (y + v),
        [
          "전체 넓이를 한 변수로 표현합니다: A(x)=(x+h)(S/x+v).",
          `A′(x)=v−hS/x². x=√(hS/v)=${x}, y=${y}.`,
          `A′는 음에서 양으로 바뀌고 양 끝에서 A→∞이므로 전역 최소. 전체 크기 ${x + h}×${y + v}, 넓이 ${(x + h) * (y + v)}.`,
        ],
        {
          params: { h, v, t, area },
          source: source(
            "calculus",
            "Problem 5",
            "인쇄 넓이와 네 여백을 변경; 정수 최적해가 생기도록 조건 생성.",
          ),
        },
      );
    },
  },
  {
    id: "integral-area",
    topic: "calculus",
    build: (r, l) => {
      const a = r(1, 4),
        b = a + r(1, 4),
        end = b + r(1, 3);
      const primitive = (x) => (x * x) / 2 - a * x;
      const result =
        l <= 2
          ? primitive(b) - primitive(0)
          : primitive(end) - 2 * primitive(a) + primitive(0);
      return q(
        "정적분과 넓이의 차이",
        `f(x)=x−${a}.\n${l <= 2 ? `∫(0..${b}) f(x) dx` : `x축과 f의 그래프 사이에서 0≤x≤${end}인 부분의 넓이`}는?`,
        frac(Math.round(result * 2), 2),
        [
          "x=a에서 함수의 부호가 바뀝니다. 넓이를 구할 때는 음의 부분을 뒤집습니다.",
          `원시함수 F(x)=x²/2−${a}x.`,
          l <= 2
            ? `F(${b})−F(0)=${frac(Math.round(result * 2), 2)}.`
            : `−[F(${a})−F(0)]+[F(${end})−F(${a})]=${frac(Math.round(result * 2), 2)}.`,
        ],
        { params: { a, b, end } },
      );
    },
  },
  {
    id: "moving-bound",
    topic: "calculus",
    build: (r, l) => {
      const a = r(1, 3),
        b = r(1, 4),
        t = r(1, 3);
      return q(
        "적분으로 정의한 함수의 미분",
        `F(x)=∫(0..${l <= 2 ? "x" : "x²"}) (${a}t²+${b}) dt.\nF′(${t})는?`,
        l <= 2 ? a * t * t + b : 2 * t * (a * t ** 4 + b),
        [
          "미적분의 기본정리로 상한을 피적분함수에 대입합니다.",
          l <= 2
            ? `F′(x)=${a}x²+${b}.`
            : `상한 x²의 도함수도 곱해 F′(x)=2x(${a}x⁴+${b}).`,
          `x=${t} 대입: ${l <= 2 ? a * t * t + b : 2 * t * (a * t ** 4 + b)}.`,
        ],
        { params: { a, b, t } },
      );
    },
  },
];
