# THINK FORGE edge-case audit — 2026-10-13

This systematic edge-case audit is distinct from the earlier maintenance. Evidence is LOCAL only. No commit/push/deploy, gallery/ranking edit, delegation, provider/cost, schema/retention, bank-version, scoring or science-content change occurred.

All three named repositories were inventoried before implementation. Only the owned repository files were edited. The supplied AGENTS and architecture > api-spec > requirements > README precedence apply.

## Commands and evidence levels

N identifiers map to exact new Node test names in the catalog. They execute under npm test and the existing verify workflow. DOM doubles are labeled; they are not browser/layout evidence. B identifiers map to tools/edge-browser.mjs. Current CI runs npm test and npm run check; **it does not execute this manual browser harness**.

Browser prerequisites verified/reused: ../output/playwright/implement-20261012/package.json, Playwright1.61.1 and C:/Program Files/Google/Chrome/Application/chrome.exe. No dependency/install/CI change. PLAYWRIGHT_PACKAGE can override the installed package.json; CHROME_PATH can override the executable.

Start node tools/serve.mjs 0 in a persistent session. In PowerShell set $env:EDGE_URL='http://127.0.0.1:<printed-port>/' then run node --test tools/edge-browser.mjs. The harness requires loopback, uses isolated headed Chrome with audio muted, fresh QA contexts, and closes its own browser. No personal browser profile/records accessed.

Functional paths use actual typing, clicks, selects and keyboard input. Composition/detached controls, quota/denial, delayed/rejected files deliberately inject labeled events/failures. They are not naturally occurring quota exhaustion, real OS IME, or mobile hardware proof. Existing reusable QA flows were read/adapted; element-atlas additionally executes its existing qa-import.js.

Captures:1440×1000/390×844/320×780; numeric page-overflow checks passed. Selected desktop initial/mobile feedback/result/experiment/lesson captures were visually reviewed. Sites are scrollable documents; this is not an exhaustive visual review of all states.

## Inventory and source coverage

Clean main baseline HEAD784e67c65aa5289e6157c4544e926d1aa74e9ba2;37tracked files, appendix. Root:dist/src,docs,test,tools,.github,ignored .qa/node_modules. api-spec.md/requirements.md/repository AGENTS.md absent.

VERIFIED full authoritative reads:architecture.md,README.md,docs/decisions.md,package.json,.gitattributes/.gitignore,workflow. VERIFIED selected source/tests:app/core/bank/achievements/progress/reasoning, relevant lifecycle/storage tests and tools/check/serve. Reusable .qa/qa-20261013/browser.js and root review-20261009/think-qa.mjs read. Repository overall PARTIAL: frozen banks/provenance/transfer and older verification appendices inspected selectively, not a new line-by-line curriculum certification. All48existing independent answer oracles ran. .git/dependencies, siblings/gallery/ranking, public site NOT_INSPECTED.

## Results / failures-before / fixes-after

npm test **104/104 PASS**, fail/skip/todo0:91existing+13new. Manual browser **4/4 PASS**. npm run check/git diff --check PASS after edited-text normalization.

Before production edits, node --test --test-name-pattern='edge:' test/app.test.js failed:
- N8: composition must not score before explicit submission; expected null record, actual answered1/correct1/XP22.
- N10: old deadline callback must not close learning; actual hidden=true vs expected false.
- First N9 fixture had no choices in logic/smoke; fixture precondition failed. Corrected to algorithms/smoke, same contract assertion retained. Then node --test --test-name-pattern='detached choice' test/app.test.js genuinely failed: late old choice must not submit a new condition; answered2vs1,XP4vs2,second mistake.

Minimal fix: composing/229 Enter ignored; rendered choice/SVG callbacks own their question; timer owns validated session generation. The same six-test command passed 6/6. N11–N13 and seven unchanged-module pure tests are coverage additions, not RED_GREEN. N4 initially compared object identity to a newly constructed mistake; expected list corrected to explicit199legacy+future records. Production retention unchanged.

## Feature/boundary matrix

Every VERIFIED row was executed locally; N/B map to exact names below.

|Feature|Cases|Actual tests/results|Remaining|
|---|---|---|---|
|Seed entry|normal/trimmed,1/40chars,empty/41/type/nonfinite/forbidden|N1,N12;B3 VERIFIED|AllUnicode NOT_RUN|
|Numeric grader|signed/equivalent fraction,zero,decimal,80/81chars,empty/type/nonfinite,tolerance inside/outside|N2;existing fraction equivalence and blank rejection;B1 VERIFIED|Everyexpression NOT_RUN|
|Version/config|levels1/4/0/5,fraction/string/nonfinite,safe index max/one-over,unsupported version,legacy empty seed retained|N3;existing mixed cycles cover 24 families and all selected questions replay exactly VERIFIED|Allseeds/indices NOT_RUN|
|Generation/correctness|v1fingerprint2240,v2cases3840,48independent answer oracle tests using enumeration/VM/SQLite/optimization|existing bank/audit tests;B1poster900area/6margins VERIFIED|Expert/difficulty NOT_RUN;SQLite not PostgreSQL|
|Learn/submit/next|blank open,valid closes,duplicates/rapidnext once,old choice inert|N9,N12;B1 VERIFIED|Allnaturally scheduled events NOT_RUN|
|Keyboard/IME/focus/mobile|normal Enter,synthetic composing Enter,3viewports actualinput|N8;B1,B2 VERIFIED|OSIME/touch/screenreader/allfocus NOT_RUN|
|Challenge/time/terminal|deadline equality/+1,repeatedtick/submit/skip/next,old timer after cancellation,10skips hidden feedback then10reviews|N10,N11;existing submit after deadline cannot score; all unseen questions remain reviewable;B3 VERIFIED|Real40min/suspension NOT_RUN;time is fixture|
|Mistakes/replay|199→200,duplicates,overflow/future retained,correct removes only matching version/condition,export/reload|N4;existing DOM double: legacy review and export preserve unknown version, XP and exact seed;B1 VERIFIED|Corrupt-private recovery NOT_IMPLEMENTED|
|Independent achievements|999→1000lastslot,then saturate/no rotation;1024/1025key,copies;hint/guided/review/repeat exclusion|N5,N6;existing actual first independent correct attempts count distinct families, never views, hints, review or repeated conditions VERIFIED|Tamper resistance N/A|
|Reasoning/checkpoints|empty/partial/fraction/malformed,not finalgrade/XP,examreveal afterfinish|existing optional rubric: unsupported/legacy, empty, partial, fraction and malformed input;checkpoint verifiers;actualexploration VERIFIED|Everyrubric UI NOT_RUN|
|Transfer|afterfeedback/afterexam,noaward|existing DOM double: transfer tasks wait for feedback, stay outside records and reset on next;actualexploration VERIFIED|Editorialre-review NOT_RUN|
|Storage/isolation|8192/8193cap,malformed/unknown,14siblings,deniedread/quota/ownclear,no summary on failedprivatewrite|N7,N13;existing progress tests;B4 VERIFIED|Silentnonconformingwrites/crosstabatomicity NOT_RUN|
|Reset/cancel/restore|cancel bothkeys,deniedwrite durablebytes preserved,partialnotice,reload/export/review|N13;B1,B2 VERIFIED|Undo N/A;export backup|
|Import/remoteasync|No inboundJSON/UI or remote service|N/A|Malformedprivate storage is not fileimport;no new recoverypolicy|
|WebMCP|feature detection/fallback inspected|PARTIAL|Native runtime NOT_RUN|

Actual exploratory pass (~30sec):CSnetwork levels1–4,hint/skip/next,math checkpoint1/2,transfer details,daily/newchallenge. No visible clipping/overlap in reviewed captures. No CSS, layout or asset change.

## Changes / evidence / integration

dist/src/app.js;test/app.test.js;new test/edge-cases.test.js,tools/edge-browser.mjs;docs/decisions.md,docs/verification.md,thisreport.
Ignored .qa/edge-20261013:initial/answer/exam-{1440,390,320}.png,record.json,red-green.txt. Answer state1296 accepted;exam0/10,10skips,closedreviews. Nominal visible UI change:NO;no thumbnail refresh required.

Node22.23.2;UTF8/noBOM/CRLF,diff checks verified. Own browser/server closed. REMOTE_CI/LIVE/DEPLOY NOT_RUN;The parent handles integration and release. Sibling checks use QA fixtures,not sibling live implementation.

## Exact new test catalog

- N1 — `edge: seed entry accepts 1 and 40 chars, trims and rejects just outside/types` — test/edge-cases.test.js — PASS
- N2 — `edge: numeric grader length, signed fraction, zero and tolerance boundaries` — test/edge-cases.test.js — PASS
- N3 — `edge: replay configuration integer/version/type boundaries preserve legacy seed semantics` — test/edge-cases.test.js — PASS
- N4 — `edge: mistake capacity 199 to 200, duplicate and oversized legacy retention is immutable` — test/edge-cases.test.js — PASS
- N5 — `edge: 999th evidence can award last slot then saturation never rotates or re-awards` — test/edge-cases.test.js — PASS
- N6 — `edge: condition key 1024/1025 bounds and defensive copies` — test/edge-cases.test.js — PASS
- N7 — `edge: aggregate exact read cap and readback-denial keep bytes and own deletion isolated` — test/edge-cases.test.js — PASS
- N8 — `edge: IME confirmation Enter leaves the numeric attempt open` — test/app.test.js — PASS
- N9 — `edge: detached choice from an old question cannot answer the new question` — test/app.test.js — PASS
- N10 — `edge: queued timer from cancelled challenge cannot finish a learning session` — test/app.test.js — PASS
- N11 — `edge: deadline equality, repeat ticks and repeated next remain terminal` — test/app.test.js — PASS
- N12 — `edge: invalid code preserves answered feedback and exam timer; rapid next advances once` — test/app.test.js — PASS
- N13 — `edge: cancelled clear and denied clear preserve durable own and sibling bytes` — test/app.test.js — PASS
- B1 — `edge-browser: independent poster oracle, blank/correct/repeat, review removal export and reload` — tools/edge-browser.mjs — PASS
- B2 — `edge-browser: IME event fixture ignored, normal Enter submits; cancelled clear preserves both keys` — tools/edge-browser.mjs — PASS
- B3 — `edge-browser: invalid code preserves challenge, ten skips finish once with hidden feedback` — tools/edge-browser.mjs — PASS
- B4 — `edge-browser: private quota failure cannot publish completion or replace sibling summary` — tools/edge-browser.mjs — PASS

## Baseline tracked inventory (names only)

Inventory does not imply every auxiliary file was fully read. Ignored QA output, dependencies and .git were not recursively reviewed. New audit files are listed above.

```text
.gitattributes
.github/workflows/pages.yml
.gitignore
README.md
architecture.md
dist/content-license.html
dist/favicon.svg
dist/index.html
dist/src/achievements.js
dist/src/app.js
dist/src/bank.js
dist/src/core.js
dist/src/cs-bank.js
dist/src/exam-utils.js
dist/src/math-bank.js
dist/src/progress.js
dist/src/questions.js
dist/src/reasoning.js
dist/src/sources.js
dist/src/transfer.js
dist/styles.css
docs/content-bank.md
docs/decisions.md
docs/leaderboard-proposal.md
docs/learning-provenance.md
docs/review-improvements.md
docs/verification-v2.md
docs/verification.md
package.json
test/app.test.js
test/audit.test.js
test/bank.test.js
test/progress.test.js
test/questions.test.js
test/reasoning.test.js
tools/check.mjs
tools/serve.mjs
```

