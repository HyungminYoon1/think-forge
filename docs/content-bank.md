# v2 문제군과 출처

16개 범주, 48개 family ID. 수학 24개, 전공 24개. 각 행은 서로 다른 세 가지 추론 과제를 묶습니다. 매개변수·레벨·보기 순서·주사위 패턴은 별도 family로 세지 않습니다.

| 범주             | 문제군 (family ID)                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| 정수·나머지·계수 | crt: 합동식 교집합 / divisibility: 정확히 하나의 배수 / integer-solutions: 정수해와 제약                      |
| 방정식·함수      | quadratic-roots: 대칭식 / composition: 함수 복원 / absolute-roots: 구간별 방정식                              |
| 함수·극값·교점   | cubic-extrema: 도함수와 구간 / rational-range: 치역·교점 매개변수 / line-parabola: 판별식·접선                |
| 도형·좌표        | chord: 현·넓이 / reflection-path: 반사 최단경로 / triangle-section: 내분·넓이비                               |
| 확률             | bayes: 역확률 / dice-pattern: 중복 패턴 / adjacent-expectation: 지시변수·선형성                               |
| 논리·수열        | sequence-inference: 부분합 역추론 / telescoping: 소거 / pigeonhole-buttons: 조작열·상태 상한 증명             |
| 벡터·행렬        | projection: 직교분해 / matrix-composition: 비가환 합성 / singular-system: 특이성과 해의 존재                  |
| 미적분·최적화    | poster-optimum: 제약식에서 전역 최소 / integral-area: 부호와 넓이 / moving-bound: 기본정리·연쇄법칙           |
| 논리             | logic-models: 만족 할당 / signed-overflow: 비트 폭·시프트 / quantified-logic: 양화사·부정                     |
| 코드             | aliasing: 얕은·깊은 복사 / recursive-trace: 호출 수·캐시 / closure-order: 바인딩 시점                         |
| 그래프 알고리즘  | shortest-path: 경로 비교 / spanning-tree: 필수 간선과 최소 신장 / graph-doubling: 점화식·이분성               |
| 시스템           | cache-replacement: FIFO·LRU 상태 / cpu-scheduling: 완료·대기 시간 / page-translation: 주소 변환·TLB 비용      |
| 네트워크         | subnet-plan: 주소 수에서 블록 크기 / longest-prefix: 경로 삭제와 최장 접두 / packet-pipeline: 병목·파이프라인 |
| 데이터베이스     | join-multiplicity: 중복·NULL 확장 / group-having: 집계·HAVING / functional-dependencies: 폐포·후보키          |
| Git              | git-reachability: DAG 집합 연산 / git-merge-base: 최선 공통 조상 / git-three-way: 공통 기반 병합              |
| 점화식·DP·DAG    | divide-recurrence: 정확한 재귀 비용 / knapsack: 0/1·정확 무게 / dag-critical-path: 임계 경로·여유             |

## 번안 7개 군

나머지 41개는 THINK FORGE 자체 제작입니다. 번안 문항·풀이에만 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 적용. 비상업적 이용·저작자표시·변경고지·동일조건변경허락. MIT의 제휴·보증을 뜻하지 않습니다. 관련 없는 코드와 자체 제작 문항의 라이선스를 이 고지로 바꾸지 않습니다.

Tom Leighton, Eric Lehman, **6.042/18.062J Final, December 14, 2004**, MIT OpenCourseWare. Fall 2010 코스에 게시된 2004 시험이며 코스 페이지의 강사와 시험 저자를 혼동하지 않습니다.

- [원문](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/resources/mit6_042jf10_final_2004/)
- [원문 해설](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/resources/mit6_042jf10_fnl_2004_sol/)

| family               | 원문 번호      | 번안·변경                                                  |
| -------------------- | -------------- | ---------------------------------------------------------- |
| graph-doubling       | Problem 2      | 초기 트리·반복 횟수 변경; 간선 수·이분성 귀납 판단         |
| bayes                | Problem 3      | 비의료 센서 검사; 비율 변경; 조건부 독립 반복 검사 추가    |
| dice-pattern         | Problem 4(a–c) | 공정한 5~8면 주사위 다섯 개; 세 중복 패턴을 한 군으로 취급 |
| pigeonhole-buttons   | Problem 5      | 색 배치 수 대신 유한 상태 상한; 엄격한 부등식의 최소 길이  |
| adjacent-expectation | Problem 7      | 라벨·복사본 수 일반화; 원형 경계 추가                      |

Prof. David Jerison, **18.01SC Single Variable Calculus, Fall 2010 — Final**, MIT OpenCourseWare.

- [원문](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/resources/mit18_01scf10_final/)
- [원문 해설](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/resources/mit18_01scf10_finalsol/)

| family         | 원문 번호 | 번안·변경                                             |
| -------------- | --------- | ----------------------------------------------------- |
| rational-range | Problem 4 | 유리함수 배율 변경; 치역·정수 매개변수의 두 교점 조건 |
| poster-optimum | Problem 5 | 인쇄 넓이·네 여백 변경; 최적 인쇄 가로 또는 전체 넓이 |

한국어 문제·풀이를 새로 작성했습니다. 원문 P8b·P7b는 이번 은행에서 번안하지 않았습니다. `moving-bound`는 원문의 sin(x²) 평균값 극한을 옮긴 문제가 아니라 다항식 적분의 상한 합성에 관한 자체 제작 문제입니다.

## 근거 범위

주 담당 Codex 에이전트가 위 원문·해설을 조사하고 번호·수치·조건을 제공했으며 Q5 여백 배치는 시각 확인했다고 명시했습니다. 이 구현 세션은 이용 조건과 4개 리소스 페이지를 직접 열어 확인했고 제공된 수치와 번안 결과를 독립 계산으로 검사했습니다. 이 세션에서 PDF 전체를 직접 렌더링·검수했다는 주장은 하지 않습니다.

- [이용 조건](https://ocw.mit.edu/pages/privacy-and-terms-of-use/): 이 세션 직접 확인. 저작자표시·비상업·동일조건변경허락 및 명칭/로고 제한.
- 원문 수치의 로컬 교차 검사: 주사위 5/54, 25/54, 25/108; Bayes 2/13; 포스터 최적 인쇄 가로 5 및 전체 넓이 162; 복사 카드 기대값 m−1; 버튼 개수 경계.
- 공인 시험 난이도, 전체 교육과정 범위, 모든 가능한 생성 사례를 전수 인증한 것은 아닙니다.
