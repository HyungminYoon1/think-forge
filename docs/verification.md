# 검증 기록

## 2026-10-13 systematic edge-case audit — LOCAL / parent integration

[104/104 Node +4/4 browser; 13 new Node tests; 3 RED/GREEN bugs](edge-cases-20261013.md). Full feature/boundary matrix, exact executable test names, actual failures-before/fixes-after, source inventory and limitations are in that report. npm run check and git diff --check PASS after UTF-8/no-BOM/CRLF normalization. Current CI includes new Node tests; tools/edge-browser.mjs remains a repeatable manual Chrome harness. No commit/push/deploy or gallery/ranking change; REMOTE_CI/LIVE/public-byte verification belongs to the parent integration.

## 2026-10-13 자동 구현 — 통합 인계

- SOURCE VERIFIED: architecture.md, README.md, docs/decisions.md, 사용자 제공 AGENTS, .gitattributes/package.json, app/core/bank/progress 및 변경한 transfer/index/styles/test를 전체 확인했습니다. api-spec.md/requirements.md/저장소 AGENTS.md는 없습니다. 저장소 전체는 PARTIAL: 파일 목록을 확인한 뒤 위 학습·저장/UI 경로를 선택했고 v1/v2 전체 문제군은 기존 독립 오라클로 검증했습니다. 변경하지 않는 모든 보조 문서·workflow·그림의 전체 내용 검토로 표현하지 않습니다. 미지정 저장소는 소유 범위 밖입니다.
- BUG: 개인 성취 저장 성공 뒤 갤러리 요약 쓰기 실패가 안내되지 않았습니다. 먼저 추가한 DOM 회귀 테스트가 notice=''로 실패했고, 수정 후 개인 증거/형제 요약 보존과 부분 실패 안내가 통과했습니다. 실제 격리 Chromium에서도 요약 쓰기만 실패시켜 privateSaved=true, summaryPreserved=true를 확인했습니다.
- CONTENT/UI: 기존 은행/seed/오답/48완료 의미를 유지하고 10개 자체 반례·조건 도전과 3항목 자기 점검 해설을 추가했습니다. 시험 진행 중은 숨기고 종료 복습에서 제공합니다. 이 활동은 저장·점수·자동 증명 채점이 없습니다. 출처 검토는 learning-provenance.md에 기록했습니다. UI change: YES.
- LOCAL: npm test **91/91 PASS**, 실패/skip/todo 0; npm run check PASS. 기존 v1 2,240조건 지문·v2 3,840 결정성·2,304 독립 정답 조건·512 수치 중간값 검사 유지. 별도 .qa/qa-20261013/domain.mjs에서 행렬 반례, 두 사람 양화사, 경로 열거, 양방향 배낭 갱신, SQLite 실제 ON/WHERE, Git 조상 DAG 검산 PASS. SQLite 경고는 기존 Node 실험적 기능 안내이며 PostgreSQL 실행 증거가 아닙니다.
- ACTUAL BROWSER: 별도 QA 세션, http://127.0.0.1:52047/think-forge/. 4단계 미적분/smoke/1296 Enter 제출, 빈 입력 거절, 10개 도전의 과제/해설, 펼치기 전후 개인 기록 동일, 잘못된 코드 후 문항 유지, 10문제 시험 종료 복습/진행 중 비공개, 실제 JSON 다운로드 PASS. 1440×1000 / 390×844 / 320×780에서 변경 패널의 페이지 가로 넘침 0, 관측한 page errors/console errors 0. 캡처를 직접 육안 확인했습니다.
- CAPTURE/SELECTORS: ignored `.qa/qa-20261013/transfer-desktop.png`, `transfer-390.png`, `transfer-320.png`, `exam-review.png`, `partial-storage.png`. desktop은 정답 제출 후 `#transfer .transfer-task`와 안쪽 `details`를 펼친 상태입니다. 시험은 `#session-result > details`의 첫 항목과 `.transfer-task`가 열린 상태입니다. 스크립트/다운로드는 같은 ignored 디렉터리입니다.
- CHANGED FILES: README.md, architecture.md, dist/index.html, dist/styles.css, dist/src/app.js, dist/src/transfer.js(new), test/app.test.js, docs/decisions.md, docs/learning-provenance.md(new), docs/verification.md. frozen questions/math-bank/cs-bank/출처 번안 파일·저장 스키마는 변경하지 않았습니다.
- FINAL FILE CHECK: 변경 텍스트10개 UTF-8 no BOM/CRLF, git diff --check PASS. Node v22.23.2. QA 브라우저와 자체 서버만 종료했으며 메인 통합 서버는 유지했습니다.
- LIMITS: Chromium 한 환경의 위 흐름만 확인했습니다. 실제 모바일 하드웨어·다른 브라우저·40분 실시간 대기·WebMCP·독립 교육 전문가 검토는 NOT_RUN. 교차 앱 갤러리 통합/새 미리보기/REMOTE_CI/LIVE/배포는 메인 담당자 작업입니다. 이 세션에서 커밋·푸시·배포·갤러리 편집·에이전트 생성은 하지 않았습니다.

검증일: 2026-10-08 (KST). 증거 상태를 분리합니다.

## LOCAL — PASS

- Node 순수 모델 시험 4개 통과. 56개 범주·단계 조합 × 40개 seed = 2,240개 생성 사례의 재현성·보기 중복·정답 포함 검증. 방정식과 루프 합은 독립 계산으로 비교.
- IAB 실제 조작: 빈 답 거부(문제 수 유지), 오답 저장, 풀이 표시, 복습 정답 후 목록 제거, 그래프 점 직접 선택, 8/12를 2/3과 동치로 판정, JS 루프 정답 14 확인.
- 10문제 도전: 화면의 문제를 직접 계산해 10/10, 정답률 100% 완료. 힌트 비활성 확인.
- JSON 내보내기 다운로드 확인. 재로딩 후 누적 XP 유지.
- WebMCP: 정상 학습 설정 반영; 허용하지 않는 seed 거부.
- 데스크톱 기본 뷰포트와 390×844, 320×720 모바일 뷰포트에서 확인. 문서 가로 넘침 없음(모바일 스크롤바 제외 콘텐츠 폭 375/305px). LIGHT ROUTE 단계 선택 줄은 의도적으로 내부 가로 스크롤.
- 확인한 브라우저 흐름의 warn/error 로그 0개. 배포 직전 npm test와 npm run check 재실행 PASS.
- UTF-8 유효성·BOM 없음·CRLF 정규화 확인. 환경 파일 없음, 일반적인 토큰/DB URL 패턴 검사에서 일치 없음(포괄적인 보안 감사는 아님).

## REMOTE_CI — PASS

- [GitHub Actions 시험·검사·배포 성공](https://github.com/HyungminYoon1/think-forge/actions/runs/37790254502)
- 검증한 앱 소스 커밋: 455e97624e6d1190473ac2f4bd4f4f6e198c1dd2. verify의 npm test/npm run check 및 deploy 모두 success 확인.
- 이 검증 기록의 후속 갱신은 문서만 변경하며 dist 앱 소스는 동일합니다.

## LIVE — PASS

- [공개 사이트](https://hyungminyoon1.github.io/think-forge/) HTTPS 접속 확인.
- dist의 6개 파일(HTML/CSS/app/core/model 또는 questions/favicon) HTTP 200 및 로컬 SHA-256 바이트 일치.
- 화면의 6 + 5에 11을 제출해 정답·풀이·13 XP 확인. 재로딩 후 13 XP 유지. WebMCP로 그래프 범주를 선택해 점·보기를 렌더링.
- 확인한 공개 흐름의 warn/error 로그 0개. 기본 화면·전체 화면 JPEG 증거는 별도 로컬 QA 폴더에 저장했고 공개 저장소에 개인 PC 경로나 QA 기록을 올리지 않음.

## 범위와 한계

모든 가능한 생성 판이나 모든 문항 의미를 전수 증명한 것은 아닙니다. 자동 시험은 표본 생성과 규칙 검증이고 실제 브라우저 시험은 위에 명시한 흐름입니다. 전체 사용자 랭킹·서버·Neon DB·API 부하 시험은 NOT_IMPLEMENTED/NOT_RUN입니다. 기록 삭제 버튼은 확인 창과 구현을 검토했으나 이번 QA에서 실제 삭제하지 않았습니다.
