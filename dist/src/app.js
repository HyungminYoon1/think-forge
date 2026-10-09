import {
  $,
  freshSeed,
  cleanSeed,
  loadLocal,
  saveLocal,
  announce,
  tool,
} from "./core.js";
import {
  TOPICS,
  makeQuestion,
  answerMatches,
  BANK_VERSION,
  LEVELS,
  challengeMinutes,
  validConfig,
  replay,
  updateMistakes,
} from "./bank.js";
import { reasoningCriteria, scoreReasoning } from "./reasoning.js";
import { loadAchievements, recordAttempt, COMPLETION_TOTAL, EVIDENCE_LIMIT } from "./achievements.js";
import { reportProgress, clearProgress } from "./progress.js";
const KEY = "think-forge-v1";
const blank = () => ({
  xp: 0,
  answered: 0,
  correct: 0,
  topics: {},
  mistakes: [],
  achievements: loadAchievements(null),
});
let saved = loadLocal(KEY, null),
  record = blank();
if (
  saved &&
  typeof saved === "object" &&
  Number.isFinite(saved.xp) &&
  Array.isArray(saved.mistakes)
) {
  record.xp = Math.max(0, Math.min(1e9, saved.xp));
  record.answered = Math.max(0, Number(saved.answered) || 0);
  record.correct = Math.max(0, Number(saved.correct) || 0);
  record.topics =
    saved.topics && typeof saved.topics === "object" ? saved.topics : {};
  // Preserve all prior data, including unsupported records for export/recovery.
  record.mistakes = saved.mistakes;
  record.achievements = loadAchievements(saved.achievements);
}
let subject = "math",
  topic = "math-mix",
  level = 4,
  mode = "learn",
  seed = freshSeed(),
  index = 0,
  current,
  answered = false,
  hintIndex = 0,
  aided = false,
  reasoningInputs = [],
  session = { total: 0, correct: 0, streak: 0, answers: [] },
  timer = 0,
  finished = false,
  reviewQueue = [],
  deadline = 0;
function persist({ summarize = false } = {}) {
  if (!saveLocal(KEY, record)) {
    announce("기록을 저장할 수 없습니다. 이번 세션은 계속 진행할 수 있습니다.");
    return false;
  }
  if (summarize && record.achievements.families.length)
    reportProgress(record.achievements.families.length, COMPLETION_TOTAL);
  return true;
}
function topics() {
  $("topic").replaceChildren(
    ...Object.entries(TOPICS)
      .filter(([, v]) => v.subject === subject)
      .map(([id, v]) =>
        Object.assign(document.createElement("option"), {
          value: id,
          textContent: v.name,
        }),
      ),
  );
  $("topic").value = topic;
}
function stats() {
  $("correct-count").textContent = session.correct;
  $("total-count").textContent = session.total;
  $("streak-count").textContent = session.streak;
  $("independent-count").textContent = record.achievements.families.length + " / " + COMPLETION_TOTAL;
  $("xp-count").textContent = record.xp + " XP";
  $("level-badge").textContent = "LEVEL " + (1 + Math.floor(record.xp / 100));
  $("review-count").textContent =
    "복습 가능 " +
    record.mistakes.filter(validConfig).length +
    "개 · 보관 " +
    record.mistakes.length +
    "개";
  $("topic-progress").replaceChildren(
    ...Object.keys(TOPICS)
      .filter((t) => record.topics[t]?.total)
      .map((t) => {
        const row = document.createElement("div");
        row.className = "topic-line";
        const a = document.createElement("span"),
          b = document.createElement("span");
        a.textContent = TOPICS[t].name;
        b.textContent =
          record.topics[t].correct + " / " + record.topics[t].total;
        row.append(a, b);
        return row;
      }),
  );
}
function renderReasoning() {
  const criteria = reasoningCriteria(current);
  reasoningInputs = [];
  $("reasoning-panel").hidden = !criteria.length;
  $("reasoning-panel").open = false;
  $("reasoning-fields").replaceChildren();
  $("reasoning-result").replaceChildren();
  for (const c of criteria) {
    const label = document.createElement("label"), input = document.createElement("input");
    input.id = "reason-" + c.id;
    input.maxLength = 40;
    input.autocomplete = "off";
    input.placeholder = "정수·분수·소수";
    input.setAttribute("aria-label", c.label);
    label.textContent = c.label;
    label.setAttribute("for", input.id);
    $("reasoning-fields").append(label, input);
    reasoningInputs.push({ id: c.id, input });
  }
}
function reasoningFeedback(score, container) {
  container.replaceChildren();
  if (!score.attempted) return;
  const text = document.createElement("p"), list = document.createElement("ul");
  text.textContent = `풀이 점검 ${score.earned}/${score.total} · 작성 ${score.attempted}/${score.total}`;
  for (const r of score.results) {
    const item = document.createElement("li");
    item.textContent = `${r.label}: ${r.value || "미작성"} · ${r.correct ? "충족" : r.attempted ? "다시 확인" : "미작성"} · 기준값 ${r.answer}`;
    list.append(item);
  }
  container.append(text, list);
}
function visual(v, el = $("question-visual")) {
  el.replaceChildren();
  if (!v) return;
  if (v.type === "table") {
    const table = document.createElement("table");
    table.className = "data-table";
    const tr = document.createElement("tr");
    for (const h of v.head) {
      const th = document.createElement("th");
      th.textContent = h;
      tr.append(th);
    }
    table.append(tr);
    for (const row of v.rows) {
      const tr = document.createElement("tr");
      for (const x of row) {
        const td = document.createElement("td");
        td.textContent = x;
        tr.append(td);
      }
      table.append(tr);
    }
    el.append(table);
    return;
  }
  const ns = "http://www.w3.org/2000/svg",
    svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 400 200");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    v.type === "plot" ? "문제의 두 점을 좌표상에 표시" : "문제의 도형과 치수",
  );
  const item = (tag, attrs, text) => {
    const n = document.createElementNS(ns, tag);
    for (const [k, val] of Object.entries(attrs)) n.setAttribute(k, val);
    if (text) n.textContent = text;
    svg.append(n);
    return n;
  };
  if (v.type === "rect") {
    item("rect", {
      x: 90,
      y: 25,
      width: 220,
      height: 125,
      fill: "#dfe8ff",
      stroke: "#3158ed",
      "stroke-width": 3,
    });
    item(
      "text",
      {
        x: 200,
        y: 177,
        "text-anchor": "middle",
        fill: "#17243b",
        "font-size": 18,
      },
      String(v.a),
    );
    item(
      "text",
      { x: 330, y: 92, fill: "#17243b", "font-size": 18 },
      String(v.b),
    );
  }
  if (v.type === "triangle") {
    item("path", {
      d: "M100 155 L100 35 L300 155 Z",
      fill: "#dfe8ff",
      stroke: "#3158ed",
      "stroke-width": 3,
    });
    item(
      "text",
      {
        x: 200,
        y: 184,
        "text-anchor": "middle",
        fill: "#17243b",
        "font-size": 18,
      },
      String(v.a),
    );
    item(
      "text",
      { x: 65, y: 100, fill: "#17243b", "font-size": 18 },
      String(v.b),
    );
  }
  if (v.type === "plot") {
    item("path", {
      d: "M30 150H365 M130 185V10",
      stroke: "#7d8eb0",
      "stroke-width": 1,
    });
    for (let n = -5; n <= 8; n++) {
      const x = 130 + n * 20;
      item("path", { d: "M" + x + " 145V155", stroke: "#7d8eb0" });
    }
    v.points.forEach(([x, y], i) => {
      item("circle", {
        cx: 130 + x * 20,
        cy: 150 - y * 16,
        r: 6,
        fill: "#3158ed",
      });
      item(
        "text",
        { x: 140 + x * 20, y: 142 - y * 16, fill: "#17243b", "font-size": 16 },
        String.fromCharCode(65 + i) + "(" + x + "," + y + ")",
      );
    });
  }
  if (v.type === "graph-choice") {
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "함수 그래프의 후보 점 선택");
    const values = [
      ...v.curve.map((point) => point[1]),
      ...v.points.map((point) => point.y),
      0,
    ];
    const low = Math.min(...values) - 3,
      high = Math.max(...values) + 3;
    const px = (x) => 200 + x * 48,
      py = (y) => 180 - ((y - low) / (high - low)) * 160;
    item("path", {
      d: "M35 " + py(0) + "H365 M200 15V185",
      stroke: "#93a2ba",
      "stroke-width": 1,
    });
    item("path", {
      d: v.curve
        .map(([x, y], i) => (i ? "L" : "M") + px(x) + " " + py(y))
        .join(" "),
      fill: "none",
      stroke: "#3158ed",
      "stroke-width": 2.5,
    });
    for (const point of v.points) {
      const dot = item("circle", {
        cx: px(point.x),
        cy: py(point.y),
        r: 8,
        fill: "#e69b12",
        tabindex: 0,
        role: "button",
        "aria-label": "점 " + point.value,
      });
      dot.addEventListener("click", () => answer(point.value));
      dot.addEventListener("keydown", (event) => {
        if (["Enter", " "].includes(event.key)) {
          event.preventDefault();
          answer(point.value);
        }
      });
      item(
        "text",
        {
          x: px(point.x) + 14,
          y: py(point.y) + 5,
          fill: "#17243b",
          "font-size": 16,
        },
        point.label,
      );
    }
  }
  el.append(svg);
}
function provenance(container, question) {
  container.replaceChildren();
  const src = question.source;
  const label = document.createElement("p");
  label.textContent = `은행 v${question.bankVersion} · ${question.family} · ${src.creator} · ${src.title}${src.question ? " · " + src.question : ""}`;
  container.append(label);
  const note = document.createElement("p");
  note.textContent = src.notice;
  container.append(note);
  for (const [title, url] of [
    ["원문", src.url],
    ["원문 해설", src.solutionUrl],
    [src.license, src.licenseUrl],
  ]) {
    if (!url) continue;
    const a = document.createElement("a");
    a.href = url;
    a.textContent = title;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    container.append(a);
  }
}
function show() {
  answered = false;
  hintIndex = 0;
  aided = false;
  finished = false;
  if (mode === "review") {
    const item = reviewQueue[index];
    if (!item) {
      finish("오답 복습을 마쳤습니다.");
      return;
    }
    current = replay(item);
  } else current = makeQuestion(topic, level, seed, index);
  renderReasoning();
  $("seed").value = current.seed;
  $("breadcrumb").textContent =
    (TOPICS[current.topic].subject === "math" ? "수학" : "컴퓨터과학") +
    " / " +
    TOPICS[current.topic].name +
    " / " +
    (current.bankVersion === 1
      ? ["", "입문 (기존)", "기본 (기존)", "응용 (기존)", "도전 (기존)"][
          current.level
        ]
      : LEVELS[current.level]);
  $("question-kind").textContent =
    TOPICS[current.topic].name +
    (current.source.kind === "adapted" ? " · 출처 번안" : " · 자체 제작");
  $("question-number").textContent =
    "QUESTION " + String(index + 1).padStart(2, "0");
  $("question-title").textContent = current.title;
  provenance($("question-source"), current);
  $("question-text").textContent = current.text;
  $("question-text").classList.toggle("code", current.code);
  visual(current.visual);
  $("numeric-answer").hidden = !!current.options;
  $("choices").replaceChildren();
  if (current.options)
    current.options.forEach((value, i) => {
      const b = document.createElement("button");
      b.className = "choice";
      const n = document.createElement("strong"),
        s = document.createElement("span");
      n.textContent =
        current.visual?.type === "graph-choice"
          ? "점"
          : String.fromCharCode(65 + i);
      s.textContent = value;
      b.append(n, s);
      b.onclick = () => answer(value);
      $("choices").append(b);
    });
  $("answer").value = "";
  $("answer").disabled = false;
  $("submit").disabled = false;
  $("next").hidden = true;
  $("skip").disabled = false;
  $("hint").disabled = mode === "challenge";
  $("hint-panel").hidden = true;
  $("explanation").hidden = true;
  $("session-result").hidden = true;
  $("question").hidden = false;
  $("feedback").className = "feedback";
  $("feedback").textContent =
    mode === "challenge"
      ? "종료 후 정답과 풀이를 확인합니다."
      : "";
  $("progress").style.width =
    (mode === "challenge"
      ? session.total * 10
      : mode === "review"
        ? (index / Math.max(1, reviewQueue.length)) * 100
        : 0) + "%";
  stats();
}
function answer(value) {
  if (answered || finished) return;
  if (mode === "challenge" && Date.now() >= deadline) {
    finish("도전 시간이 끝났습니다.");
    return;
  }
  if (value !== null && (!String(value).trim() || String(value).length > 80)) {
    announce("정답을 먼저 입력하세요.");
    return;
  }
  answered = true;
  const correct =
    value !== null && answerMatches(String(value), current.answer);
  const reasoning = scoreReasoning(current, Object.fromEntries(reasoningInputs.map(({ id, input }) => [id, input.value])));
  session.total++;
  session.correct += correct ? 1 : 0;
  session.streak = correct ? session.streak + 1 : 0;
  session.answers.push({
    question: current,
    value,
    correct,
    status: value === null ? "건너뜀" : correct ? "정답" : "오답",
    reasoning,
  });
  record.answered++;
  record.correct += correct ? 1 : 0;
  record.xp = Math.min(1e9, record.xp + (correct ? 10 + current.level * 3 : 2));
  const completedBefore = record.achievements.families.length;
  record.achievements = recordAttempt(record.achievements, current, {
    correct, aided: aided || $("reasoning-panel").open || reasoning.attempted > 0, review: mode === "review",
  });
  if (record.achievements.seen.length >= EVIDENCE_LIMIT)
    announce("독립 완료 판정 한도 1,000개 조건입니다. XP·오답 기록은 계속 저장합니다.");
  const t = record.topics[current.topic] || { total: 0, correct: 0 };
  t.total++;
  t.correct += correct ? 1 : 0;
  record.topics[current.topic] = t;
  if (!correct && record.mistakes.length >= 200)
    announce(
      "오답 보관 한도 200개입니다. 기존 기록은 유지합니다. 내보내기 또는 복습 후 새 오답을 저장할 수 있습니다.",
    );
  record.mistakes = updateMistakes(record.mistakes, current, correct);
  persist({ summarize: record.achievements.families.length > completedBefore });
  $("feedback").className =
    "feedback " + (mode === "challenge" ? "" : correct ? "correct" : "wrong");
  $("feedback").textContent =
    mode === "challenge"
      ? value === null ? "건너뜀." : "답을 기록했습니다."
      : correct
        ? "정답입니다."
        : (value === null ? "건너뜀. " : "오답. ") +
          "정답은 " +
          current.answer +
          "입니다.";
  for (const { input } of reasoningInputs) input.disabled = true;
  if (mode !== "challenge") reasoningFeedback(reasoning, $("reasoning-result"));
  $("answer").disabled = true;
  $("submit").disabled = true;
  $("skip").disabled = true;
  $("hint").disabled = true;
  $("next").hidden = false;
  for (const b of $("choices").children) {
    b.disabled = true;
    const v = b.querySelector("span").textContent;
    b.classList.toggle(
      "hit",
      mode !== "challenge" && answerMatches(v, current.answer),
    );
    b.classList.toggle("miss", mode !== "challenge" && !correct && v === value);
  }
  $("steps").replaceChildren(
    ...current.steps.map((s) =>
      Object.assign(document.createElement("li"), { textContent: s }),
    ),
  );
  $("explanation").hidden = mode === "challenge";
  stats();
  $("progress").style.width =
    (mode === "challenge" ? session.total * 10 : 0) + "%";
  if (mode === "challenge" && session.total >= 10)
    finish("10문제 도전을 마쳤습니다.");
}
function finish(title) {
  if (finished) return;
  finished = true;
  clearInterval(timer);
  timer = 0;
  $("next").hidden = true;
  $("skip").disabled = true;
  $("submit").disabled = true;
  $("answer").disabled = true;
  $("hint").disabled = true;
  for (const b of $("choices").children) b.disabled = true;
  for (const { input } of reasoningInputs) input.disabled = true;
  $("session-result").replaceChildren();
  const h = document.createElement("h2"),
    n = document.createElement("strong"),
    p = document.createElement("p");
  h.textContent = title;
  const submitted = session.answers.filter((entry) => entry.value !== null).length;
  n.textContent = session.correct + " / " + (mode === "challenge" ? 10 : session.total);
  p.textContent =
    (mode === "challenge" ? "제출 답 정답률 " : "정답률 ") +
    (submitted ? Math.round((session.correct / submitted) * 100) : 0) +
    "% · 누적 " +
    record.xp +
    " XP";
  $("session-result").append(h, n, p);
  if (mode === "challenge") {
    const count = document.createElement("p");
    count.textContent = `제출 ${submitted} · 건너뜀 ${session.total - submitted} · 미제출 ${10 - session.total}`;
    $("session-result").append(count);
    const entries = [...session.answers];
    // Include the timed-out current question and all unseen questions, without scoring them as mistakes.
    for (let i = session.total; i < 10; i++)
      entries.push({
        question: makeQuestion(topic, level, seed, i),
        value: null,
        correct: false,
        status: "미제출",
      });
    for (const [i, entry] of entries.entries()) {
      const details = document.createElement("details"),
        summary = document.createElement("summary"),
        text = document.createElement("p"),
        result = document.createElement("p"),
        steps = document.createElement("ol"),
        credit = document.createElement("div");
      summary.textContent = `${i + 1}. ${entry.status} · ${entry.question.title}`;
      text.textContent = entry.question.text;
      text.className = "review-text";
      result.textContent = `내 답: ${entry.value ?? entry.status} / 정답: ${entry.question.answer}`;
      steps.replaceChildren(
        ...entry.question.steps.map((s) =>
          Object.assign(document.createElement("li"), { textContent: s }),
        ),
      );
      credit.className = "question-source";
      provenance(credit, entry.question);
      const diagram = document.createElement("div");
      diagram.className = "question-visual";
      // v2 review visuals are read-only data tables; no live answer controls.
      if (entry.question.visual?.type === "table")
        visual(entry.question.visual, diagram);
      const analysis = document.createElement("div");
      if (entry.reasoning) reasoningFeedback(entry.reasoning, analysis);
      details.append(summary, text, diagram, result, analysis, steps, credit);
      details.ontoggle = () => {
        if (!details.open) return;
        record.achievements = recordAttempt(record.achievements, entry.question, { aided: true });
        persist();
      };
      $("session-result").append(details);
    }
  }
  const button = document.createElement("button");
  button.textContent = "새 문제로 다시 도전";
  button.onclick = () => start(freshSeed());
  $("session-result").append(button);
  $("session-result").hidden = false;
  $("question").hidden = true;
  $("session-label").textContent = "세션 완료";
  stats();
}
function start(nextSeed = seed) {
  const validatedSeed = cleanSeed(nextSeed);
  clearInterval(timer);
  timer = 0;
  seed = validatedSeed;
  index = 0;
  finished = false;
  session = { total: 0, correct: 0, streak: 0, answers: [] };
  reviewQueue = record.mistakes.filter(validConfig);
  deadline =
    mode === "challenge" ? Date.now() + challengeMinutes(level) * 60000 : 0;
  $("difficulty").value = String(level);
  $("challenge-help").textContent =
    `현재 단계 ${challengeMinutes(level)}분 · 종료 후 전체 풀이`;
  document
    .querySelectorAll("[data-subject]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.subject === subject)),
    );
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.mode === mode)),
    );
  announce("");
  if (mode === "review" && !reviewQueue.length) {
    $("question").hidden = true;
    finish("아직 복습할 오답이 없습니다.");
    return;
  }
  show();
  $("session-label").textContent =
    mode === "learn"
      ? "학습 모드 · 은행 v2"
      : mode === "review"
        ? "오답 복습 · 저장 당시 버전"
        : `${challengeMinutes(level)}:00`;
  if (mode === "challenge") {
    timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      $("session-label").textContent =
        String(Math.floor(seconds / 60)).padStart(2, "0") +
        ":" +
        String(seconds % 60).padStart(2, "0");
      if (!seconds) finish("도전 시간이 끝났습니다.");
    }, 250);
  }
}
$("submit").onclick = () => answer($("answer").value);
$("answer").onkeydown = (e) => {
  if (e.key === "Enter") answer($("answer").value);
};
$("skip").onclick = () => answer(null);
$("next").onclick = () => {
  if (answered && !finished) {
    index++;
    show();
  }
};
$("hint").onclick = () => {
  if (answered || mode === "challenge") return;
  markAided();
  $("hint-panel").hidden = false;
  $("hint-panel").textContent =
    current.hints[Math.min(hintIndex++, current.hints.length - 1)];
};
function markAided() {
  if (answered || finished || aided) return;
  aided = true;
  record.achievements = recordAttempt(record.achievements, current, { aided: true });
  persist();
}
$("reasoning-panel").ontoggle = () => {
  if ($("reasoning-panel").open) markAided();
};
document.querySelectorAll("[data-subject]").forEach(
  (b) =>
    (b.onclick = () => {
      subject = b.dataset.subject;
      topic = subject === "math" ? "math-mix" : "cs-mix";
      topics();
      start(freshSeed());
    }),
);
document.querySelectorAll("[data-mode]").forEach(
  (b) =>
    (b.onclick = () => {
      mode = b.dataset.mode;
      start(freshSeed());
    }),
);
$("topic").onchange = () => {
  topic = $("topic").value;
  start(freshSeed());
};
$("difficulty").onchange = () => {
  level = Number($("difficulty").value);
  start(freshSeed());
};
$("new-session").onclick = () => start(freshSeed());
$("apply-seed").onclick = () => {
  try {
    start($("seed").value);
  } catch (e) {
    announce(e.message);
  }
};
$("daily").onclick = () => {
  mode = "challenge";
  start("daily-" + new Date().toLocaleDateString("sv-SE"));
};
$("export").onclick = () => {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            version: 2,
            currentBankVersion: BANK_VERSION,
            exportedAt: new Date().toISOString(),
            record,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "think-forge-my-record.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce("내 학습 기록을 내보냈습니다.");
};
$("clear").onclick = () => {
  if (
    confirm(
      "이 브라우저의 학습 기록과 오답을 삭제할까요? 내보낸 파일은 유지됩니다.",
    )
  ) {
    record = blank();
    // Only remove this service's summary; other services share the origin.
    const stored = saveLocal(KEY, record);
    const cleared = stored && clearProgress();
    start(freshSeed());
    announce(stored && cleared ? "기록을 삭제했습니다." : "일부 기록을 삭제하지 못했습니다. 브라우저 저장 설정을 확인하세요.");
  }
};
tool(
  "start_practice",
  "학습 시작",
  {
    type: "object",
    properties: {
      topic: { type: "string", enum: Object.keys(TOPICS) },
      difficulty: { type: "integer", minimum: 1, maximum: 4 },
      seed: { type: "string", maxLength: 40 },
    },
    required: ["topic", "difficulty", "seed"],
    additionalProperties: false,
  },
  (input) => {
    if (
      !input ||
      !TOPICS[input.topic] ||
      !Number.isInteger(input.difficulty) ||
      input.difficulty < 1 ||
      input.difficulty > 4
    )
      throw Error("Invalid configuration");
    const next = cleanSeed(input.seed);
    topic = input.topic;
    subject = TOPICS[topic].subject;
    level = input.difficulty;
    mode = "learn";
    topics();
    $("difficulty").value = String(level);
    start(next);
    return { topic, level, seed, question: current.title };
  },
);
topics();
start();
addEventListener("pagehide", () => clearInterval(timer));
