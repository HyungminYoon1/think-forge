import { question as q, frac, sum, table } from "./exam-utils.js";
import { source } from "./sources.js";

export const CS = [
  {
    id: "logic-models",
    topic: "logic",
    build: (r, l) => {
      const n = l <= 2 ? 3 : 4,
        flip = r(0, 1),
        models = [];
      for (let bits = 0; bits < 2 ** n; bits++) {
        const p = !!(bits & 1),
          s = !!(bits & 2),
          t = !!(bits & 4),
          u = !!(bits & 8);
        if (
          (!p || s) &&
          (!s || t) &&
          (flip ? !t || p : !p || t) &&
          (n === 3 || ((t || u) && !(p && u)))
        )
          models.push(bits);
      }
      return q(
        "명제 제약의 만족 할당",
        `변수 ${n === 3 ? "p,q,r" : "p,q,r,s"}는 각각 참/거짓이다.\n(p→q) ∧ (q→r) ∧ (${flip ? "r→p" : "p→r"})${n === 4 ? " ∧ (r∨s) ∧ ¬(p∧s)" : ""}를 참으로 만드는 할당은 몇 개인가?`,
        models.length,
        [
          "함의 A→B는 A가 참이고 B가 거짓일 때만 거짓입니다.",
          `모든 ${2 ** n}개 할당에서 제약을 동시에 적용합니다.`,
          `통과한 할당은 ${models.length}개. 연쇄 함의에서 중복 제약을 독립 사건처럼 곱하면 안 됩니다.`,
        ],
        { params: { n, flip } },
      );
    },
  },
  {
    id: "signed-overflow",
    topic: "logic",
    build: (r, l) => {
      const bits = r(4, 7),
        half = 2 ** (bits - 1),
        a = half - r(2, 5),
        b = r(6, Math.min(9, half - 1)),
        raw = (a + b) % 2 ** bits,
        signed = raw >= half ? raw - 2 ** bits : raw;
      return q(
        "고정 폭 정수와 오버플로",
        `${bits}비트 2의 보수 정수에서 a=${a}, b=${b}. 덧셈 결과는 하위 ${bits}비트만 남긴다.\n${l <= 2 ? "결과를 부호 있는 정수로 읽으면?" : "결과에 산술 오른쪽 시프트 1회를 적용한 부호 있는 값은? (부호 비트를 복제)"}`,
        l <= 2 ? signed : Math.floor(signed / 2),
        [
          "수학적 합과 고정 폭 비트열의 해석을 분리합니다.",
          `합 ${a + b}의 하위 비트는 ${raw.toString(2).padStart(bits, "0")}; 부호 있는 해석은 ${signed}.`,
          l <= 2
            ? `결과는 ${signed}.`
            : `산술 시프트는 음수에서 내림 나눗셈이므로 ${Math.floor(signed / 2)}.`,
        ],
        { params: { bits, a, b } },
      );
    },
  },
  {
    id: "quantified-logic",
    topic: "logic",
    build: (r, l) => {
      const n = r(3, 5),
        rows = Array.from({ length: n }, () =>
          Array.from({ length: n }, () => r(0, 1)),
        );
      const answer =
        l <= 2
          ? rows.filter((row) => row.every(Boolean)).length
          : rows.filter((row) => row.some(Boolean)).length;
      return q(
        "양화사의 범위와 관계 행렬",
        `집합 D={1,…,${n}}의 관계 R을 아래 행렬로 준다. 행은 x, 열은 y, 1은 참이다.\n${l <= 2 ? "∀y R(x,y)" : "¬∀y ¬R(x,y)"}를 만족하는 x의 개수는?`,
        answer,
        [
          "고정된 x에 대한 y 전체의 참/거짓을 먼저 조사합니다.",
          l <= 2
            ? "∀는 해당 행이 전부 1이어야 합니다."
            : "드모르간 법칙으로 ¬∀y ¬R(x,y)는 ∃y R(x,y)와 같습니다.",
          `조건을 만족하는 행은 ${answer}개.`,
        ],
        {
          params: { n, rows },
          visual: table(
            ["x\\y", ...Array.from({ length: n }, (_, i) => i + 1)],
            rows.map((row, i) => [i + 1, ...row]),
          ),
        },
      );
    },
  },
  {
    id: "aliasing",
    topic: "code",
    build: (r, l) => {
      const a = r(1, 5),
        b = r(2, 6),
        c = r(1, 4),
        deep = l <= 2;
      const program = `const a = [[${a}], [${b}]];\nconst b = ${deep ? "a.map(row => [...row])" : "[...a]"};\nb[0].push(${c});\nb[1] = [9];\nconsole.log(a[0].length + a[1][0]);`;
      return q(
        "복사와 참조 별칭",
        "JavaScript (실행하지 않고 추론)\n" + program,
        (deep ? 1 : 2) + b,
        [
          "바깥 배열의 복사와 내부 배열의 복사를 구분합니다.",
          deep
            ? "내부 행까지 복사했으므로 push는 원본에 영향을 주지 않습니다."
            : "얕은 복사에서는 b[0]과 a[0]이 같은 배열이므로 길이가 2가 됩니다.",
          `b[1] 재대입은 원본 행을 바꾸지 않습니다. 출력=${(deep ? 1 : 2) + b}.`,
        ],
        { code: true, params: { a, b, c, deep }, program },
      );
    },
  },
  {
    id: "recursive-trace",
    topic: "code",
    build: (r, l) => {
      const n = r(4, 7),
        memo = l >= 3,
        cache = new Map();
      let calls = 0;
      const f = (x) => {
        calls++;
        if (x < 2) return x;
        if (memo && cache.has(x)) return cache.get(x);
        const v = f(x - 1) + f(x - 2);
        cache.set(x, v);
        return v;
      };
      const value = f(n);
      const program = `let calls = 0;\nconst memo = new Map();\nfunction f(n) {\n  calls++;\n  if (n < 2) return n;\n${memo ? "  if (memo.has(n)) return memo.get(n);\n" : ""}  const v = f(n-1) + f(n-2);\n  memo.set(n, v);\n  return v;\n}\nf(${n});\nconsole.log(calls);`;
      return q(
        "재귀 호출 수와 메모이제이션",
        "JavaScript: 기저·캐시 적중 호출도 calls에 포함한다. 출력은?\n" +
          program,
        calls,
        [
          "함수 반환값과 함수 진입 횟수는 서로 다릅니다.",
          memo
            ? "계산이 끝난 n만 저장하며 기저 호출은 저장하지 않습니다. 캐시 적중도 진입 횟수에 더합니다."
            : "C(0)=C(1)=1, C(n)=1+C(n−1)+C(n−2).",
          `f(${n})=${value}이지만 calls=${calls}.`,
        ],
        { code: true, params: { n, memo }, program },
      );
    },
  },
  {
    id: "closure-order",
    topic: "code",
    build: (r, l) => {
      const n = r(3, 5),
        offset = r(1, 4),
        block = l <= 2;
      const program = `const fs = [];\nfor (${block ? "let" : "var"} i=0; i<${n}; i++) {\n  fs.push(() => i + ${offset});\n}\nconsole.log(fs.reduce((s,f) => s+f(), 0));`;
      return q(
        "클로저와 바인딩 시점",
        "JavaScript 출력은? 모든 함수는 반복문 종료 뒤 호출된다.\n" + program,
        block ? (n * (n - 1)) / 2 + n * offset : n * (n + offset),
        [
          "함수를 저장할 때 값이 복사되는지, 바인딩을 참조하는지 살펴봅니다.",
          block
            ? "let 반복문은 회차마다 별도 i 바인딩을 만듭니다."
            : `var의 모든 클로저는 같은 i를 읽습니다. 종료 시 i=${n}.`,
          `합은 ${block ? (n * (n - 1)) / 2 + n * offset : n * (n + offset)}.`,
        ],
        { code: true, params: { n, offset, block }, program },
      );
    },
  },
  {
    id: "shortest-path",
    topic: "algorithms",
    build: (r, l) => {
      const edges = [
        [0, 1, r(2, 6)],
        [0, 2, r(3, 8)],
        [1, 2, r(1, 4)],
        [1, 3, r(4, 8)],
        [2, 3, r(1, 4)],
      ];
      if (l >= 3) edges.push([2, 1, 1]);
      const d = [0, Infinity, Infinity, Infinity];
      for (let k = 0; k < 3; k++)
        for (const [a, b, w] of edges) d[b] = Math.min(d[b], d[a] + w);
      return q(
        "가중 그래프의 최단 경로",
        `정점 S,A,B,T의 방향 간선 (출발,도착,비용):\n${edges.map(([a, b, w]) => `${"SABT"[a]}→${"SABT"[b]}:${w}`).join("; ")}\n${l <= 2 ? "S에서 T까지의 최단 거리" : "S에서 T까지 이동한 뒤, T→S 비용 2인 추가 간선을 이용해 S로 돌아오는 최단 닫힌 경로의 비용"}은?`,
        d[3] + (l <= 2 ? 0 : 2),
        [
          "방향을 지키며 각 도착점까지의 후보 비용을 비교합니다.",
          `S에서 A,B,T까지의 최단 거리: ${d.slice(1).join(", ")}.`,
          l <= 2
            ? `답 ${d[3]}.`
            : `모든 비용이 양수이므로 중간 순환은 도움되지 않습니다. T→S의 2를 더해 ${d[3] + 2}.`,
        ],
        { params: { edges } },
      );
    },
  },
  {
    id: "spanning-tree",
    topic: "algorithms",
    build: (r, l) => {
      const edges = [
        [0, 1, r(1, 4)],
        [1, 2, r(2, 6)],
        [2, 3, r(1, 5)],
        [0, 3, r(4, 8)],
        [0, 2, r(3, 7)],
      ];
      const forced = l >= 3 ? 3 : -1,
        parent = [0, 1, 2, 3],
        root = (x) => (parent[x] === x ? x : root(parent[x]));
      let cost = 0;
      const selected = [];
      const add = (i) => {
        const [a, b, w] = edges[i],
          x = root(a),
          y = root(b);
        if (x === y) return;
        parent[x] = y;
        cost += w;
        selected.push(i);
      };
      if (forced >= 0) add(forced);
      edges
        .map((_, i) => i)
        .sort((a, b) => edges[a][2] - edges[b][2])
        .forEach(add);
      return q(
        "최소 신장 트리와 필수 간선",
        `무방향 그래프의 간선 비용:\n${edges.map(([a, b, w]) => `${"ABCD"[a]}—${"ABCD"[b]}:${w}`).join("; ")}\n${l <= 2 ? "모든 정점을 잇는 최소 신장 트리" : "A—D 간선을 반드시 포함하는 신장 트리 중 최소"}의 총비용은?`,
        cost,
        [
          l <= 2
            ? "비용이 작은 간선부터 순환을 만들지 않게 고릅니다."
            : "필수 간선을 먼저 선택해 축약한 뒤 순환을 만들지 않게 나머지를 고릅니다.",
          `선택 간선: ${selected
            .map((i) =>
              edges[i]
                .slice(0, 2)
                .map((x) => "ABCD"[x])
                .join("—"),
            )
            .join(", ")}.`,
          `정점 4개를 3개 간선으로 연결, 총비용 ${cost}.`,
        ],
        { params: { edges, forced } },
      );
    },
  },
  {
    id: "graph-doubling",
    topic: "algorithms",
    build: (r, l) => {
      const v = r(3, 6),
        e = v - 1,
        k = r(2, 4),
        vertices = 2 ** k * v,
        edges = 2 ** k * e + k * 2 ** (k - 1) * v;
      const answer = l <= 2 ? edges : "두 복사본의 색을 반대로 배치한다";
      return q(
        "그래프 복제와 불변식",
        `정점 ${v}개, 간선 ${e}개인 트리 G에서 시작한다. 매 단계 G의 두 복사본을 만들고 대응하는 정점끼리 간선을 하나씩 추가한다.\n${l <= 2 ? `${k}회 뒤 간선 수는?` : `${k}회 뒤에도 이분 그래프임을 보이는 올바른 귀납 구성은?`}`,
        answer,
        [
          "정점 수 V′=2V, 간선 수 E′=2E+V입니다.",
          `Vₖ=2ᵏV₀, Eₖ=2ᵏE₀+k·2^(k−1)V₀. 여기서는 정점 ${vertices}, 간선 ${edges}.`,
          "초기 트리는 이분 그래프. 두 번째 복사본의 색을 뒤집으면 복사본 내부와 대응 간선 모두 다른 색을 잇습니다.",
        ],
        {
          params: { v, e, k },
          options:
            l <= 2
              ? null
              : [
                  answer,
                  "두 복사본에 항상 같은 색 배치를 쓴다",
                  "간선 수가 짝수이면 이분 그래프다",
                  "정점 수가 짝수이면 이분 그래프다",
                ],
          source: source(
            "discrete",
            "Problem 2",
            "초기 그래프를 트리로 제한, 반복 횟수·크기 변경; 간선 수와 이분성 증명 선택으로 재구성.",
          ),
        },
      );
    },
  },
  {
    id: "cache-replacement",
    topic: "systems",
    build: (r, l) => {
      const cap = l <= 2 ? 2 : 3,
        refs = Array.from({ length: l <= 2 ? 8 : 11 }, () => r(0, 4));
      const run = (policy) => {
        let faults = 0;
        const queue = [];
        for (const x of refs) {
          const at = queue.indexOf(x);
          if (at < 0) {
            faults++;
            if (queue.length === cap) queue.shift();
            queue.push(x);
          } else if (policy === "LRU") {
            queue.splice(at, 1);
            queue.push(x);
          }
        }
        return faults;
      };
      const fifo = run("FIFO"),
        lru = run("LRU");
      return q(
        "교체 정책의 상태 추적",
        `빈 페이지 프레임 ${cap}개. 참조열: ${refs.join(", ")}.\nFIFO는 적중 시 순서를 유지하고 LRU는 적중한 페이지를 가장 최근으로 바꾼다.\n${l <= 2 ? "LRU의 페이지 부재 횟수" : "FIFO 부재 횟수 − LRU 부재 횟수"}는?`,
        l <= 2 ? lru : fifo - lru,
        [
          "각 접근 뒤 프레임과 교체 순서를 따로 기록합니다.",
          `FIFO 부재 ${fifo}회, LRU 부재 ${lru}회.`,
          `답 ${l <= 2 ? lru : fifo - lru}. 차이는 음수가 될 수도 있으며 어느 정책도 모든 참조열에서 우월하지 않습니다.`,
        ],
        { params: { cap, refs } },
      );
    },
  },
  {
    id: "cpu-scheduling",
    topic: "systems",
    build: (r, l) => {
      const burst = [r(3, 7), r(2, 6), r(1, 5)],
        quantum = 2,
        completion = [0, 0, 0];
      let time = 0;
      if (l <= 2) {
        for (let i = 0; i < 3; i++) {
          time += burst[i];
          completion[i] = time;
        }
      } else {
        const remain = [...burst];
        while (remain.some(Boolean))
          for (let i = 0; i < 3; i++)
            if (remain[i]) {
              const use = Math.min(quantum, remain[i]);
              time += use;
              remain[i] -= use;
              if (!remain[i]) completion[i] = time;
            }
      }
      const waiting = sum(completion) - sum(burst);
      return q(
        "스케줄링과 평균 대기 시간",
        `P1,P2,P3가 모두 시각 0에 도착하며 CPU 실행시간은 각각 ${burst.join(", ")}이다. 문맥교환 비용은 0.\n${l <= 2 ? "FCFS, P1→P2→P3 순서" : "라운드 로빈, 타임 퀀텀 2, 초기 큐 P1→P2→P3"}에서 평균 대기 시간은?`,
        frac(waiting, 3),
        [
          "각 프로세스의 완료 시각을 구한 뒤 실행 시간을 뺍니다.",
          `완료 시각: ${completion.join(", ")}. 대기시간 합=${sum(completion)}−${sum(burst)}=${waiting}.`,
          `평균=${frac(waiting, 3)}.`,
        ],
        { params: { burst, quantum } },
      );
    },
  },
  {
    id: "page-translation",
    topic: "systems",
    build: (r, l) => {
      const size = 2 ** r(8, 10),
        page = r(1, 4),
        offset = r(10, 40),
        frames = [3, 7, 2, 6, 1],
        addr = page * size + offset,
        den = 2 ** r(1, 3),
        memory = r(5, 10) * 10,
        tlb = r(1, 3),
        average = tlb + memory + memory / den;
      return q(
        "가상주소와 메모리 접근 비용",
        l <= 2
          ? `페이지 크기 ${size}B. 가상 페이지 0~4의 물리 프레임은 각각 [${frames}]. 가상주소 ${addr}의 물리주소는?`
          : `TLB 적중률 ${den - 1}/${den}, 적중 확인 ${tlb}ns, 메모리 접근 ${memory}ns. 단일 단계 페이지 표이며 TLB miss 때 메모리의 표 조회 1회가 추가된다. 데이터 접근도 1회 필요하고 페이지 부재는 없다. 평균 접근 시간(ns)은?`,
        l <= 2 ? frames[page] * size + offset : frac(average * den, den),
        [
          l <= 2
            ? "페이지 번호는 주소를 페이지 크기로 나눈 몫, 오프셋은 나머지입니다."
            : "적중·실패 경로 각각에서 표와 데이터에 대한 메모리 접근 횟수를 구합니다.",
          l <= 2
            ? `페이지 ${page}, 오프셋 ${offset}, 프레임 ${frames[page]}; 물리주소 ${frames[page] * size + offset}.`
            : `적중 ${tlb + memory}ns, 실패 ${tlb + 2 * memory}ns.`,
          l <= 2
            ? "프레임 시작 주소에 오프셋을 더합니다."
            : `가중평균=(${den - 1}/${den})×${tlb + memory}+(1/${den})×${tlb + 2 * memory}=${average}ns.`,
        ],
        { params: { size, page, offset, frames, den, memory, tlb } },
      );
    },
  },
  {
    id: "subnet-plan",
    topic: "network",
    build: (r, l) => {
      const hosts = r(18, 50),
        subnets = l <= 2 ? 4 : 8;
      let bits = 2;
      while (2 ** bits - 2 < hosts) bits++;
      const prefix = 32 - bits,
        block = 2 ** bits * subnets;
      return q(
        "호스트 조건에서 주소 블록 설계",
        `각 서브넷에 일반 호스트 ${hosts}대가 필요하고 네트워크·브로드캐스트 주소를 제외한다. 동일 크기의 서브넷 ${subnets}개를 하나의 CIDR 블록에 빈틈없이 배치한다.\n${l <= 2 ? "각 서브넷의 가능한 가장 긴 접두 길이 (/ 뒤 숫자)" : "전체를 담는 최소 크기 상위 블록의 접두 길이 (/ 뒤 숫자)"}는?`,
        l <= 2 ? prefix : 32 - Math.log2(block),
        [
          "2ʰ−2≥호스트 수인 최소 h를 찾습니다.",
          `h=${bits}이므로 각 서브넷은 /${prefix}, ${2 ** bits}개 주소입니다.`,
          `전체 ${block}개 주소, 상위 접두 /${32 - Math.log2(block)}.`,
        ],
        { params: { hosts, subnets } },
      );
    },
  },
  {
    id: "longest-prefix",
    topic: "network",
    build: (r, l) => {
      const octet = r(130, 190),
        rules = [
          ["10.0.0.0/8", "A"],
          ["10.4.0.0/16", "B"],
          ["10.4.128.0/17", "C"],
          ["0.0.0.0/0", "D"],
        ];
      return q(
        "최장 접두 라우팅",
        `목적지는 10.4.${octet}.9. 라우팅 표는 아래와 같다. ${l <= 2 ? "" : "링크 C 장애로 /17 경로만 삭제되었다. "}최장 접두 일치로 선택하는 출력 링크는?`,
        l <= 2 ? "C" : "B",
        [
          "일치한 경로 중 접두 길이가 가장 긴 것을 선택합니다.",
          `세 번째 옥텟 ${octet}는 128~255이므로 원래 /17에도 일치합니다.`,
          l <= 2
            ? "/17이 /16, /8, /0보다 길어 C."
            : "/17 삭제 후 남은 최장 일치는 /16이므로 B. 기본 경로로 바로 가지 않습니다.",
        ],
        {
          options: ["A", "B", "C", "D"],
          params: { octet },
          visual: table(["목적지 CIDR", "링크"], rules),
        },
      );
    },
  },
  {
    id: "packet-pipeline",
    topic: "network",
    build: (r, l) => {
      const packets = r(3, 6),
        links = l <= 2 ? 2 : 3,
        tx = r(2, 5),
        prop = r(1, 3),
        bottleneck = l <= 2 ? tx : tx * 2;
      const times = Array.from({ length: links }, (_, i) =>
        i === 1 ? bottleneck : tx,
      );
      const total =
        sum(times) + (packets - 1) * Math.max(...times) + links * prop;
      return q(
        "저장 후 전달과 파이프라인",
        `같은 크기의 패킷 ${packets}개를 시각 0부터 연속 전송한다. 직렬 링크 ${links}개의 패킷당 전송시간은 [${times}]ms, 각 링크 전파 지연은 ${prop}ms이다. 모든 라우터는 패킷 전체 수신 뒤 전달한다. 다른 트래픽·처리시간·손실 없음.\n마지막 패킷의 마지막 비트가 목적지에 도착하는 시각(ms)은?`,
        total,
        [
          "첫 패킷의 지연과 뒤따르는 패킷의 출력 간격을 구분합니다.",
          `첫 패킷은 전송시간 합 ${sum(times)} + 전파지연 ${links * prop}.`,
          `이후 간격은 병목 ${Math.max(...times)}ms. 전체 ${total}ms.`,
        ],
        { params: { packets, links, tx, prop, times } },
      );
    },
  },
  {
    id: "join-multiplicity",
    topic: "database",
    build: (r, l) => {
      const a = [...Array(r(1, 3)).fill(1), 2, 3, null],
        b = [...Array(r(1, 4)).fill(1), 2, null],
        filter = l >= 3;
      const rows = [];
      for (const x of a) {
        const found = b.filter((y) => x !== null && y !== null && x === y);
        if (found.length) for (const y of found) rows.push([x, y]);
        else rows.push([x, null]);
      }
      const answer = filter
        ? rows.filter((x) => x[1] !== null).length
        : rows.length;
      return q(
        "LEFT JOIN과 NULL 필터",
        `A(k)=[${a.map((x) => x ?? "NULL")}], B(k)=[${b.map((x) => x ?? "NULL")}]. 중복 행을 유지한다. SQL의 NULL 비교는 UNKNOWN이다.\nSELECT COUNT(*) FROM A LEFT JOIN B ON A.k=B.k${filter ? " WHERE B.k IS NOT NULL" : ""};\n결과는?`,
        answer,
        [
          "같은 키가 여러 번 있으면 양쪽 행 수의 곱만큼 결합됩니다.",
          `키 1: ${a.length - 3}×${b.length - 2}=${(a.length - 3) * (b.length - 2)}행, 키 2: 1행. 키 3과 NULL은 각각 NULL 확장 1행.`,
          filter
            ? `WHERE가 NULL 확장 행을 제거하므로 ${answer}.`
            : `COUNT(*)는 NULL 확장 행도 세므로 ${answer}.`,
        ],
        { params: { a, b, filter }, code: true },
      );
    },
  },
  {
    id: "group-having",
    topic: "database",
    build: (r, l) => {
      const rows = [
          ["A", r(2, 6)],
          ["A", null],
          ["B", r(1, 3)],
          ["B", r(3, 7)],
          ["C", null],
        ],
        limit = r(4, 7);
      const groups = new Map();
      for (const [k, v] of rows) {
        if (!groups.has(k)) groups.set(k, []);
        if (v !== null) groups.get(k).push(v);
      }
      const selected = [...groups].filter(
        ([, v]) => v.length && sum(v) >= limit,
      );
      const answer =
        l <= 2 ? selected.length : sum(selected.map(([, v]) => v.length));
      return q(
        "GROUP BY·HAVING과 NULL 집계",
        `T(team,score)는 아래 표와 같다.\nSELECT team, COUNT(score) AS n FROM T GROUP BY team HAVING SUM(score)>=${limit};\n${l <= 2 ? "결과 행의 개수" : "결과에 나온 n 값의 합"}는?`,
        answer,
        [
          "SUM과 COUNT(score)는 NULL을 제외합니다. 전부 NULL인 SUM은 0이 아니라 NULL입니다.",
          `HAVING을 통과한 팀: ${selected.map(([k, v]) => `${k}(합 ${sum(v)}, n ${v.length})`).join(", ") || "없음"}.`,
          `요구한 값은 ${answer}.`,
        ],
        {
          params: { rows, limit },
          visual: table(
            ["team", "score"],
            rows.map(([k, v]) => [k, v ?? "NULL"]),
          ),
        },
      );
    },
  },
  {
    id: "functional-dependencies",
    topic: "database",
    build: (r, l) => {
      const fds = [
          [
            ["A", "B"],
            ["B", "C"],
          ],
          [
            ["A", "B"],
            ["B", "A"],
            ["B", "C"],
          ],
          [
            ["A", "B"],
            ["B", "C"],
            ["C", "A"],
          ],
        ][r(0, 2)],
        input = ["AB", "AD", "BD", "CD", "A", "D"][r(0, 5)];
      const closure = (input) => {
        const s = new Set(input);
        let old;
        do {
          old = s.size;
          for (const [a, b] of fds)
            if ([...a].every((x) => s.has(x))) for (const x of b) s.add(x);
        } while (s.size !== old);
        return [...s];
      };
      const candidates = [];
      for (let mask = 1; mask < 16; mask++) {
        const set = [..."ABCD"].filter((_, i) => mask & (1 << i));
        if (
          closure(set).length === 4 &&
          !set.some(
            (_, i) => closure(set.filter((_, j) => j !== i)).length === 4,
          )
        )
          candidates.push(set.join(""));
      }
      return q(
        "속성 폐포와 후보키",
        `관계 R(A,B,C,D)의 함수 종속성은 ${fds.map(([a, b]) => `${a}→${b}`).join(", ")}. 그 외 종속성은 이들로부터 유도되는 것뿐이다.\n${l <= 2 ? `${input}의 폐포에 속하는 속성 수` : "후보키의 개수"}는?`,
        l <= 2 ? closure(input).length : candidates.length,
        [
          "오른쪽에 없는 D는 모든 키에 반드시 포함됩니다. 종속성을 더 이상 늘지 않을 때까지 적용합니다.",
          `(${input})⁺={${closure(input).sort()}}.`,
          `최소성을 확인한 후보키: ${candidates.join(", ")}. ${l <= 2 ? `폐포 크기 ${closure(input).length}.` : `후보키 ${candidates.length}개.`}`,
        ],
        { params: { fds, input } },
      );
    },
  },
  {
    id: "git-reachability",
    topic: "git",
    build: (r, l) => {
      const n = r(2, 4),
        parents = {
          A: [],
          B: ["A"],
          C: ["B"],
          X: ["B"],
          Y: ["X"],
          M: ["C", "Y"],
        };
      let tip = "C";
      for (let i = 0; i < n; i++) {
        parents[`D${i}`] = [tip];
        tip = `D${i}`;
      }
      const reach = (t) => {
        const s = new Set();
        const visit = (x) => {
          if (s.has(x)) return;
          s.add(x);
          parents[x].forEach(visit);
        };
        visit(t);
        return s;
      };
      const left = reach(tip),
        right = reach("M"),
        only = [...left].filter((x) => !right.has(x)),
        sym = [...only, ...[...right].filter((x) => !left.has(x))];
      return q(
        "Git DAG의 도달 가능 집합",
        `각 커밋의 부모 (자식→부모):\n${Object.entries(parents)
          .map(([k, v]) => `${k}→${v.join(",") || "없음"}`)
          .join(
            "; ",
          )}\nleft=${tip}, right=M. git rev-list --count ${l <= 2 ? "right..left" : "left...right"}의 값은?`,
        l <= 2 ? only.length : sym.length,
        [
          "..는 오른쪽 끝에서 도달 가능하되 왼쪽 끝에서는 불가능한 커밋입니다. ...는 대칭차입니다.",
          `left에만 있는 커밋: ${only.join(", ")}. right에만: ${[...right].filter((x) => !left.has(x)).join(", ")}.`,
          `요구한 개수 ${l <= 2 ? only.length : sym.length}.`,
        ],
        { params: { parents, tip } },
      );
    },
  },
  {
    id: "git-merge-base",
    topic: "git",
    build: (r, l) => {
      const hard = l >= 3,
        parents = hard
          ? { A: [], B: ["A"], C: ["A"], D: ["B", "C"], E: ["C", "B"] }
          : { A: [], B: ["A"], C: ["B"], D: ["B"], E: ["D"] };
      return q(
        "공통 조상과 최선 공통 조상",
        `커밋의 부모 (자식→부모): ${Object.entries(parents)
          .map(([k, v]) => `${k}→${v.join(",") || "없음"}`)
          .join(
            "; ",
          )}.\n${hard ? "D와 E" : "C와 E"}의 merge-base --all 결과 커밋 수는?`,
        hard ? 2 : 1,
        [
          "공통 조상 중 다른 공통 조상의 조상이 되는 오래된 후보를 제외합니다.",
          hard
            ? "B와 C는 서로의 조상이 아닌 공통 조상입니다. A는 B와 C의 조상이므로 제외."
            : "B는 두 끝점의 공통 조상이고 A보다 가깝습니다.",
          `최선 공통 조상은 ${hard ? "B,C 두 개" : "B 하나"}. 커밋 시각으로 하나를 고르는 규칙이 아닙니다.`,
        ],
        { params: { hard, parents } },
      );
    },
  },
  {
    id: "git-three-way",
    topic: "git",
    build: (r, l) => {
      const base = r(1, 5),
        ours = base + r(1, 3),
        theirs = l <= 2 ? base : ours + r(1, 3),
        answer = l <= 2 ? String(ours) : "충돌 해결 필요";
      return q(
        "공통 기반을 이용한 병합",
        `텍스트 파일은 한 줄만 있다. 공통 기반: value=${base}; ours: value=${ours}; theirs: value=${theirs}. 일반 3-way 텍스트 병합, 별도 병합 드라이버 없음.\n${l <= 2 ? "자동 병합 후 value 값은?" : "같은 줄을 서로 다르게 수정한 병합 결과는?"}`,
        answer,
        [
          "ours와 theirs끼리만 비교하지 말고 각각 기반에서 바뀌었는지 봅니다.",
          l <= 2
            ? `theirs는 기반과 같으므로 ours의 변경 ${ours}를 채택합니다.`
            : "양쪽이 같은 기반의 같은 줄을 서로 다른 내용으로 바꿨으므로 수동 해결이 필요합니다.",
        ],
        {
          params: { base, ours, theirs },
          options:
            l <= 2
              ? null
              : [
                  answer,
                  "더 늦은 커밋의 값 자동 선택",
                  "두 수의 합 자동 선택",
                  "항상 기반 값 유지",
                ],
        },
      );
    },
  },
  {
    id: "divide-recurrence",
    topic: "recurrences",
    build: (r, l) => {
      const k = r(3, 6),
        n = 2 ** k,
        c = r(1, 3),
        quadratic = l >= 3;
      let value = 1;
      for (let size = 2; size <= n; size *= 2)
        value = 2 * value + c * (quadratic ? size * size : size);
      return q(
        "분할 정복 점화식의 정확한 비용",
        `T(1)=1, n은 2의 거듭제곱. T(n)=2T(n/2)+${c}${quadratic ? "n²" : "n"}.\nT(${n})의 정확한 값은?`,
        value,
        [
          "재귀 트리 각 깊이에서 노드 수와 노드당 비용을 곱합니다.",
          quadratic
            ? `내부 층 비용은 ${c}n²(1+1/2+…+1/2^(k−1)), 잎 비용 n.`
            : `각 내부 층 비용은 ${c}n이며 내부 층은 log₂n=${k}개, 잎 비용 n.`,
          `따라서 T(${n})=${value}. 점근 차수만 답하지 않습니다.`,
        ],
        { params: { k, n, c, quadratic } },
      );
    },
  },
  {
    id: "knapsack",
    topic: "recurrences",
    build: (r, l) => {
      const weights = [2, 3, 4, 5],
        values = weights.map(() => r(3, 10)),
        capacity = l <= 2 ? 6 : 8,
        exact = l >= 3;
      let best = -Infinity,
        bestMask = 0;
      for (let mask = 0; mask < 16; mask++) {
        let w = 0,
          v = 0;
        for (let i = 0; i < 4; i++)
          if (mask & (1 << i)) {
            w += weights[i];
            v += values[i];
          }
        if ((exact ? w === capacity : w <= capacity) && v > best) {
          best = v;
          bestMask = mask;
        }
      }
      return q(
        "0/1 배낭과 도달 불가능 상태",
        `물건 1~4의 (무게,가치): ${weights.map((w, i) => `(${w},${values[i]})`).join(", ")}. 각 물건은 최대 한 번 사용한다.\n무게 합이 ${capacity}${exact ? "과 정확히 같도록" : "을 넘지 않도록"} 고를 때 최대 가치는?`,
        best,
        [
          exact
            ? "정확한 무게 DP에서 도달 불가능 상태는 0이 아니라 −∞로 둡니다."
            : "dp[i,w]=앞 i개에서 무게 한도 w의 최대 가치로 두고 선택/미선택을 비교합니다.",
          `최적 선택의 한 예: ${weights
            .map((_, i) => i + 1)
            .filter((_, i) => bestMask & (1 << i))
            .join(", ")}번.`,
          `최대 가치=${best}. 무한 배낭과 혼동하지 않습니다.`,
        ],
        { params: { weights, values, capacity, exact } },
      );
    },
  },
  {
    id: "dag-critical-path",
    topic: "recurrences",
    build: (r, l) => {
      const times = [r(1, 4), r(2, 5), r(2, 5), r(1, 4), r(2, 5)],
        edges = [
          [0, 2],
          [1, 2],
          [1, 3],
          [2, 4],
          [3, 4],
        ],
        finish = [];
      for (let i = 0; i < 5; i++)
        finish[i] =
          Math.max(
            0,
            ...edges.filter(([, b]) => b === i).map(([a]) => finish[a]),
          ) + times[i];
      const deadline = finish[4] + (l <= 2 ? 0 : 2),
        latest = [...Array(5)].fill(deadline);
      for (let i = 4; i >= 0; i--) {
        const next = edges
          .filter(([a]) => a === i)
          .map(([, b]) => latest[b] - times[b]);
        if (next.length) latest[i] = Math.min(...next);
      }
      return q(
        "DAG 작업 의존성과 여유 시간",
        `작업 A~E 소요시간: [${times}]. 선행 간선: A→C, B→C, B→D, C→E, D→E. 선행 작업이 모두 끝나야 시작하며 병렬 작업 수 제한은 없다. 시각 0에 시작 가능.\n${l <= 2 ? "모든 작업을 끝내는 최소 시간" : `전체 마감이 ${deadline}일 때 A의 시작을 최대 몇 시간 늦출 수 있는가?`}`,
        l <= 2 ? finish[4] : latest[0] - times[0],
        [
          "합류에서는 선행 완료 시간의 합이 아니라 최댓값을 사용합니다.",
          `최초 완료 A~E: ${finish.join(", ")}.`,
          l <= 2
            ? `최소 완료 ${finish[4]}.`
            : `마감에서 역방향으로 최늦은 시작을 구합니다. A의 최늦은 시작=${latest[0] - times[0]}.`,
        ],
        { params: { times, edges, deadline } },
      );
    },
  },
];
