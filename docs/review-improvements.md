# 리뷰 개선 — 로컬 검증·통합 인계

2026-10-09 KST. THINK FORGE 저장소만 수정. 브라우저 QA·캡처·통합·공개 배포는 주 담당자 작업이다.

## 입력 확인

| 입력 | 상태 | 확인 범위 |
| --- | --- | --- |
| 지정 think-forge 저장소 | PARTIAL | 전체 파일 목록·초기 git status 확인(수정 없음). 아래 작업 관련 파일 전체 확인. node_modules와 변경하지 않는 workflow/favicon은 내용 검토 대상에서 제외 |
| architecture.md, README.md, docs/decisions.md, .gitattributes, package.json | VERIFIED | 전체 읽음. UTF-8 no BOM, CRLF. 아키텍처→README→결정 기록을 확인한 뒤 수정 |
| api-spec.md, requirements.md | NOT_INSPECTED | 파일 목록에 존재하지 않음. 임의 요구사항 문서를 만들지 않음 |
| v2 bank/math-bank/cs-bank/exam-utils/sources, app/core, index/styles, 콘텐츠 라이선스 | VERIFIED | 문제군 48개·조건·정답·풀이·출처·UI·저장 책임 확인. 새 모듈과 최종 diff 확인 |
| 기존 test/ 및 tools/check.mjs, tools/serve.mjs | VERIFIED | 모델/DOM 더블/정적 검사/loopback 제공 경계 확인 |
| docs/content-bank.md, verification-v2.md, verification.md | VERIFIED | 전체 내용 확인. 과거 LIVE/REMOTE_CI 결과를 이번 변경의 증거로 사용하지 않음 |
| questions.js의 v1 | PARTIAL | 입력 판정 및 버전 경계를 확인. 고정 생성기 전체를 다시 편집·재설계하지 않음. 2,240개 출력 지문과 기존 시험으로 회귀 확인 |
| docs/leaderboard-proposal.md | PARTIAL | 과거 DESIGN ONLY 제안의 목적/경계 확인. 비용·서비스 조건 재조사 안 함; 이번 기능에 사용하지 않음 |
| 형제 저장소 | NOT_INSPECTED | allowlist에 사용할 최상위 디렉터리 이름만 확인. 다른 저장소 파일 열람·수정 없음 |
| 외부 MIT 시험 원문/해설 | NOT_INSPECTED | 이번 검토에서는 새 웹/PDF 조사 없음. 기존 저자·문항 번호·원문/해설·변경 고지·권리 범위를 보존 |

## 구현

선택형 풀이 입력은 다음 8개 군의 수치 중간값이다. 각 기준에 1점, 빈 값 미작성, 오류 0점, 동치 분수/소수 인정. 중간값들의 일치만 점검하며 자연어 풀이·증명 전체를 채점하지 않는다. 최종 정답/XP와 별도로 표시한다.

| 군 | 입력 기준 |
| --- | --- |
| composition | 복원한 기울기 a, 상수항 b |
| triangle-section | 내분점 D의 x/y좌표 |
| bayes | 불량이면서 모두 경고 / 정상이면서 모두 경고의 두 결합 확률 |
| projection | 직교분해 계수 t, 잔차 w의 x/y성분 |
| poster-optimum | 최소 넓이에서 인쇄 영역의 가로/세로 |
| cpu-scheduling | P1/P2/P3의 완료 시각 |
| packet-pipeline | 첫 패킷 도착 시각, 이후 도착 간격 |
| dag-critical-path | C 최초 시작, D 최초 완료, E 최초 시작 |

학습은 제출 후 기준값과 부분 점수, 시험은 종료 후 각 복습 항목에서 표시한다. 입력은 필드당 최대 40자, 2~3필드. 원문 입력/점수는 세션 메모리에만 존재하고 localStorage/JSON 내보내기에 없다.

독립 완료는 서로 다른 v2 문제군 최대 48개. 2·4단계에서 처음 시도한 조건을 힌트·풀이 기준 없이 맞혀야 한다. 보기 정답 선택도 실제 입력 답으로 취급한다. 안내 단계, 오답 복습, 동일 조건의 재제출·공개된 해설 재풀이는 완료를 추가하지 않는다. seed/index와 안내 유무를 제외한 조건 정체성을 최대 1,000개 보관; 기존 기록을 밀어내지 않고 한도에서는 새 완료 판정만 중단한다. 성취 목록과 증거는 기존 개인 기록에 더해지며 기존 XP/방문을 성취로 환산하지 않는다.

실제 새 독립 완료 후 개인 기록 저장 성공 때만 공유 요약을 갱신한다. 초기 뷰·힌트·해설 열기에서는 새 요약을 쓰지 않는다. 요약은 완료 수/48/실제 UTC 갱신 시각만 포함한다. 진행 수가 같으면 기존 시각을 유지한다. 저장 차단·잘못된 요약은 데이터 교체 없이 실패. 삭제는 자기 항목만 지우며 다른 14개 기록을 보존한다. localStorage의 여러 탭 갱신은 별도 원자적 트랜잭션이 아니다.

수치 정답 오류는 검사한 조건에서 발견되지 않아 기존 v2 공식·RNG·48개 군은 유지했다. 실제 수정한 오류는 제출 후 XP 상한 초과 가능성과 시험의 제출/건너뜀 혼동이다. XP는 제출 시에도 최대 1e9이며, 시험 전체 점수는 정답/10, 제출 답 정답률은 실제 답이 있는 문항만 분모로 계산한다. 건너뜀의 기존 오답·2 XP 규칙과 미제출의 XP/오답 제외는 유지한다.

## 48개 군의 구조·난도 검토

아래는 코드/문항의 작업 구조 검토다. 인간 학습자의 수행 시간·정답률을 측정한 난도 평가가 아니다. 수능 난도를 검증하거나 네 단계가 공인 시험 등급에 대응한다고 주장하지 않는다. 기존 48개 오라클(2,304조건)과 추가 경계/반례 검산에서 확인한 조건의 정답이 일치했다.

| 범주 | 군별 추론 과제 | 복합 단계의 제한/검토 결과 |
| --- | --- | --- |
| 정수·계수 | crt: 합동식→범위 합; divisibility: 정확히 하나의 배수; integer-solutions: 정수해+하한 | CRT 해 주기는 35, 상한 77~105. 정수식 우변 28~45라 열거 후보가 적다. CRT 150조건, 정수해 144조건 추가 전범위 경계 확인 |
| 방정식·함수 | quadratic-roots: 근의 대칭식; composition: 합성에서 원함수 복원; absolute-roots: 절댓값 구간 분리 | 한 정형식의 변형. composition은 두 계수를 복원하나 계수 범위가 작다. 직접 근 대입/구간 검산 유지 |
| 함수·교점 | cubic-extrema: 끝점/임계점; rational-range: 치역/판별식/퇴화; line-parabola: 접선 판별식 | cubic 구간에서는 값 차가 항상 4a³. rational-range는 k=0 퇴화를 제외해야 하며 기존 검산 유지 |
| 도형 | chord: 현 이등분→넓이; reflection-path: 반사→내분; triangle-section: 내분→넓이비 | chord/reflection은 3-4-5 구조로 제한. 내분점 독립 좌표 검산과 수치 입력으로 관계 점검 |
| 확률 | bayes: 두 결합 확률→정규화; dice-pattern: 종류 선택→배치; adjacent-expectation: 경계 지시변수 | Bayes 반복 검사는 조건부 독립을 명시. 주사위는 1/2단계에서도 패턴이 다르므로 단순 안내만의 차이가 아님. 전 사건 열거/카드 순열 검산 유지 |
| 수열·논리 | sequence-inference: 부분합 역추론; telescoping: 범위 소거; pigeonhole-buttons: 상태 상한+엄격 부등식 | 복합 소거 답은 항상 c, 버튼은 작은 3~5 버튼/30~90 상태 상한. 수열 합 직접 열거·엄격 경계 유지 |
| 벡터·행렬 | projection: 직교분해/잔차; matrix-composition: 비가환 순서; singular-system: 소거+존재성 | 특이 조건은 항상 a², 비가환 차의 성분 합이 0일 수 있어 합만으로 가환성을 결론내릴 수 없음. 질문은 성분 합에 한정 |
| 미적분 | poster-optimum: 제약식→전역 최소; integral-area: 부호 구간/넓이; moving-bound: 기본정리/연쇄법칙 | 포스터는 정수 최적해로 생성. moving-bound는 짧은 직접 적용으로 최고 단계 전체 난도를 대표하지 못함. 수치 최적화/적분/차분 검산 유지 |
| 명제·비트 | logic-models: 연쇄 제약; signed-overflow: 고정 폭/산술 시프트; quantified-logic: 행과 양화사 | 3~4명제/3~5행으로 작은 열거. 양화사 복합은 부정 변환 한 번이라 복잡성 증가가 제한됨 |
| 코드 | aliasing: 바깥/내부 참조; recursive-trace: 기저/캐시 진입 수; closure-order: let/var 바인딩 | 재귀 입력 4~7, 복합에서는 메모이제이션으로 실제 호출 수 감소. 표시 코드의 Node VM 실행 검산 유지 |
| 그래프 | shortest-path: 방향/경로; spanning-tree: 필수 간선+최소 연결; graph-doubling: 점화식/이분 귀납 | 정점 4개 경로/트리, proof는 구성 선택이지 직접 증명 작성이 아님. 올바른 색 구성·동일 색 구성 실패·짝수 정점/간선 반례 추가 |
| 시스템 | cache-replacement: FIFO/LRU 추적; cpu-scheduling: RR 완료→평균 대기; page-translation: 주소/TLB 평균 | 캐시 차는 0일 수 있고 음수도 허용. CPU 3개 동시 도착/교환 비용 0. 시간단위 큐 시뮬레이션으로 완료값 검산 |
| 네트워크 | subnet-plan: 호스트→블록; longest-prefix: 장애 후 최장 일치; packet-pipeline: 최초 지연+병목 | 고정 라우팅에서 답 C/B만 반복. 실제 IPv4 마스크로 모든 생성 옥텟 130~190의 122조건 확인. 파이프라인 도착 시뮬레이션 유지 |
| SQL·FD | join-multiplicity: 곱/NULL 확장; group-having: NULL 집계/필터; functional-dependencies: 폐포/최소키 | 작은 표/속성 4개. SQLite 실제 질의 유지; FD는 16개 0/1 튜플 쌍의 합법 관계 반례로 36조건 독립 검산 |
| Git | git-reachability: 도달 집합 차; git-merge-base: 최선 공통 조상; git-three-way: 기반과 변경 | merge-base의 복합 답은 2, 같은 줄의 서로 다른 수정은 항상 충돌 보기. 정답 수치가 고정된 군은 인증된 고난도 과제로 보지 않음 |
| 점화식·DP | divide-recurrence: 내부 층/잎 비용; knapsack: 0/1/정확 무게; dag-critical-path: 병렬 합류/여유 | knapsack 복합의 무게 [2,3,4,5], 한도 정확히 8에서는 3+5만 가능해 최적화 선택이 사실상 없다. RNG/기존 캠페인은 유지, 별도 은행 버전 개편 후보. DAG 합류는 합이 아니라 최대 |

모든 seed를 전수 검증한 것은 아니다. 정답의 결정성/검산, UI 동작, 콘텐츠 권리 확인, 실제 시험 난도는 서로 다른 근거다. 외부 출처의 재조사·법률 검토·전문가 문항 평가는 이번 실행에서 수행하지 않았다.

## LOCAL 검증

- Node v22.23.2, npm test: 89개 통과, 실패/skip/todo 0. 기존 64개 유지에 신규 모델/검산/DOM 더블 25개 추가. Node 내장 SQLite의 experimental 경고는 기존 검사에서 나오며 시험 실패가 아니다.
- 기존 v1 출력 SHA-256 6c4ad42947c220a1e14e79f99c3384f01bf5f1ba0350d4e19efd54e9b93dc1c9 유지(2,240조건). v2 결정성/출처 3,840조건, 정답 독립 오라클 2,304조건 유지.
- 수치 중간값 8군×4단계×16조건=512개 사례. 독립 모듈에서 조합 사건 열거, 좌표 보간, 직교성 탐색, 수치 최소화, 시간단위 큐/작업 스케줄, 패킷 도착 시뮬레이션 사용. 각 필드 잘못된 값/빈 값과 최종 답·풀이 점수 분리 확인.
- 공유 요약의 정확한 키·15개 allowlist·경계·잘못된 날짜·초과 데이터·읽기/쓰기 차단·형제 기록 보존·변하지 않는 실제 갱신 시각 확인.
- 독립 성취의 조건 정체성, 안내/힌트/복습 제외, 첫 정답/중복/초과 이력/로드 검증. DOM 더블에서 시험 해설을 펼친 뒤 같은 조건 재풀기 제외, 제출 후 XP 상한, 내보내기에 풀이 입력 없음, private 저장 실패 시 요약 미작성 확인.
- npm run check: dist JS 구문 및 상대 자산 경로 PASS. 변경 텍스트 16개 파일 UTF-8 no BOM / CRLF PASS, git diff --check PASS.
- DOM 더블은 실제 브라우저/E2E/접근성 렌더링 증거가 아니다. Browser E2E / SCREENSHOTS / REMOTE_CI / LIVE는 이번 변경에 대해 NOT_RUN.

## 주 담당자 브라우저 확인·캡처

npm run dev -- 0이 출력하는 http://127.0.0.1:<port>/ 를 별도 QA 프로필에서 연다. 실제 개인 기록을 테스트 입력으로 덮어쓰거나 개발자 도구로 성취/점수를 주입하지 않는다.

1. 새 화면은 수학 혼합/4단계. 사용 방법을 열어 학습/시험의 공개 시점, 1·3단계 출발점 규칙 확인. 1~4단계 바로 선택 가능. 390×844와 320×720에서 도움말·입력·표의 넘침/탭 이동 확인.
2. 수학 → 미적분·최적화 → 4단계 → 학습 → 코드 smoke 적용. 첫 포스터는 인쇄 영역 xy=900, 좌우/상하 합계 여백 각각 6. 최적 x=y=30, 전체 종이 36×36=1296. 풀이 과정 입력을 열고 가로 30, 세로 0, 최종 답 1296 제출. 실제 화면에 정답·풀이 점검 1/2·세로 기준값 30·해설·22 XP를 캡처. 부분 점검이 독립 완료를 추가하면 안 된다.
3. 다음 moving-bound 답 510, 그다음 넓이 17/2. 풀이 입력이 없는 군에서 패널이 숨겨지는지 확인.
4. 컴퓨터과학 → 운영체제·메모리 → 4단계 → 학습 → smoke. 첫 FIFO-LRU 차 0 제출 후 다음 RR 문제. 실행시간 [6,2,4], P1/P2/P3 완료 [12,4,10], 대기 합 26-12=14, 평균 14/3. 중간값 전부와 최종 답 제출해 3/3 실제 풀이 점검을 캡처.
5. 컴퓨터과학 → 네트워크 → 4단계 → smoke. 첫 라우팅은 /17 제거 뒤 B 선택. 다음 패킷: 전송 [3,6,3]ms, 전파 각 2ms, 첫 도착 18, 간격 6, 4개 최종 도착 36. 풀이 입력/분수 허용/모바일 표시 확인.
6. 시험 피드백 캡처: 수학 미적분/4단계 → 10문제 시험 → smoke. 첫 문제 중간값 30/30, 최종 1296 제출. 다음 답 510 제출. 나머지 8문제는 건너뛰기/다음으로 끝낸다. 전체 점수 2/10, 제출 답 정답률 100%, 제출 2·건너뜀 8·미제출 0. 첫 복습을 펼치면 풀이 점검 2/2와 출처/해설이 나온다. 제출 시점에는 중간값 정오·기준값을 공개하면 안 된다.
7. 독립 완료 캡처는 별도 새 QA 프로필에서 수학 혼합/4단계/smoke의 첫 수열 복원 문제를 직접 풀어 답 204 제출(힌트·풀이 기준 미사용). S3=27,S5=65이므로 a1=5,d=4, 합(k=1..6)(ak+ak+1)=6(10+24)=204. 독립 완료 1/48, 새 최소 요약 완료 1/전체 48 확인. 같은 코드 재시작·정답 재제출로 완료 수와 갱신 시각이 변하면 안 된다. 다음 특이행렬 문제는 힌트를 연 후 답 25 제출; 완료 수 1 유지.
8. 재로드 후 개인 성취가 유지되는지 확인. 기록 내보내기에 achievements만 추가되고 풀이 입력/점수는 없는지 확인. 갤러리는 own 최소 요약만 읽도록 주 담당자가 통합 검증. 기록 삭제 확인창에서 삭제 후 own 요약만 제거, 다른 앱 요약은 유지. 저장 차단 때도 다음 문제 조작 가능하며 저장 실패를 알린다.
9. 시험 시간 만료는 주 담당자 QA 시계 제어가 있으면 확인. 미제출은 XP/오답에 넣지 않는다. 미제출 복습을 실제 펼친 뒤 같은 코드 학습에서 그 문항을 맞혀도 독립 완료가 추가되지 않는다. 이번 세션에서는 이 경계를 DOM 더블로만 검사.
10. 출처 패널·라이선스 페이지의 원저자/원문/해설/CC BY-NC-SA/변경 고지와 비제휴 문구 확인. CSP connect-src none 유지, 외부 런타임 호출/콘솔 오류 없음 확인. 외부 출처 링크는 별도 탭.

## 변경 경로

- 기존 수정: README.md, architecture.md, docs/decisions.md, dist/index.html, dist/styles.css, dist/content-license.html, dist/src/app.js, dist/src/sources.js, test/app.test.js.
- 신규: dist/src/reasoning.js, dist/src/achievements.js, dist/src/progress.js, test/reasoning.test.js, test/progress.test.js, test/audit.test.js, docs/review-improvements.md.
- questions.js, bank.js, math-bank.js, cs-bank.js, 원본 출처 링크/저자/번안 조건, workflow, package.json은 변경하지 않음.
- commit / push / provisioning / account access / 다른 저장소 수정 / 에이전트 생성 없음. 공용 랭킹·백엔드 미구현 유지.
