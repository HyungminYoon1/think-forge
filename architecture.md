# THINK FORGE architecture

Browser-only static GitHub Pages application. Public output is dist/ only.

- dist/src/model.js (or questions.js): pure deterministic generation, validation, rules and scoring. No DOM/storage/network.
- dist/src/bank.js: version routing, family selection and pure mistake identity/retention helpers; questions.js remains the frozen v1 generator. math-bank.js/cs-bank.js/exam-utils.js/sources.js contain pure v2 generation and provenance metadata. URLs are attribution links, not runtime fetches.
- dist/src/reasoning.js: pure, optional numeric checkpoint criteria and one-point-per-checkpoint scoring for eight v2 families. Not free-text/proof grading; it does not change numeric answer scoring or XP.
- dist/src/achievements.js: pure validation and transition of distinct independent family achievements, plus a bounded history of attempted/disclosed conditions. No DOM, clock, storage or network.
- dist/src/app.js: DOM rendering, inputs and session lifecycle. Uses model functions; no DB or remote calls.
- dist/src/core.js: seeded RNG, bounded input validation, feature-detected WebMCP, device-local storage helpers.
- dist/src/progress.js: storage boundary for the approved same-origin gallery aggregate. Reads only web-lab-progress-v1, validates 15 fixed repo IDs, then updates/removes only think-forge. No private payload or external transmission.
- test/: deterministic Node model tests; not a replacement for browser gameplay QA.
- tools/: loopback preview and static checks; .github/: pinned Pages deployment.

Device-local learning/game progress is explicitly labeled and removable; no cloud persistence, identities or global leaderboard are implemented. No analytics, external AI APIs, accounts, audio or secrets. Runtime network blocked by CSP connect-src none. The global-ranking proposal is documentation only, not an implemented service. Do not add one without a separate API/data-retention/cost decision.

## Local persistence boundaries (D10-D12)

The existing think-forge-v1 record retains XP (0..1e9), topic counters, at most 200 new mistakes, and export behavior. Existing oversized/unsupported mistake records remain preserved; no automatic eviction or bank regeneration change.

An additive achievements object has version:1, at most 48 allowlisted family IDs, at most 1,000 condition identities of at most 1,024 characters each, and a saturation flag. Identity contains family, basic/complex band and deterministic parameters; no name, date, seed or input history. It ignores seed/index and the guided/independent presentation of equal conditions. Only a first correct v2 level-2/4 attempt without hint/checkpoint assistance and outside mistake review adds a family. Hints, opening checkpoint criteria, answer/skip, and opening an exam solution mark conditions as seen. Merely viewing a question, generating a new code, reaching the deadline or rendering closed exam reviews does not add completion. Full history stops new independent awards; existing achievements, XP, mistakes and export remain usable. It never rotates/forgets evidence to re-award a shown answer.

Checkpoint inputs and their assessment live in the current session only; exam feedback waits until finish. They are not written into either localStorage record or exported JSON.

The aggregate schema is exactly {version:1,apps:{[repoId]:{completed,total,updatedAt}}}. Valid integers satisfy 0<=completed<=total<=1000; timestamps are canonical UTC ISO strings. Summary text is limited to 8,192 characters; fixed allowlist is recorded in progress.js. THINK FORGE total is 48. On a new independent family completion, after private evidence is successfully persisted, the app recomputes completed from its validated distinct family list; an initial view, hint, example and zero completions never create a badge. Unchanged counts retain their real previous timestamp. Unsupported/malformed/oversized summaries and unavailable storage fail without replacing data. Clearing the private record successfully removes only the own aggregate entry; siblings are preserved, and partial deletion is reported. Gallery reads this aggregate only, not private evidence.
