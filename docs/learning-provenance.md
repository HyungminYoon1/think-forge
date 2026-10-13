# 추론 도전 근거 · 2026-10-13

transfer.js의 10개 과제·한국어 해설·작은 반례는 자체 작성했습니다. 원문 시험 번안 7군과 별개이며 기존 출처·라이선스를 바꾸지 않습니다. 아래 출판자·대학·공식 제품 문서에서 원리를 확인했습니다. 개별 출처는 관련 도전에도 연결됩니다.

- 정수 나눗셈·양화사: [MIT Mathematics for Computer Science 읽기](https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/pages/readings/), 명제/술어와 정수론 단원. 6의 인수 2·3과 두 사람 관계는 직접 구성한 반례입니다.
- 정지점·끝점: [OpenStax Calculus 1 §4.3](https://openstax.org/books/calculus-volume-1/pages/4-3-maxima-and-minima). 필요조건과 충분조건을 구별했습니다.
- 행렬 합성: [Georgia Tech Interactive Linear Algebra, Matrix Multiplication](https://textbooks.math.gatech.edu/ila/matrix-multiplication.html). 성분 합 비교는 행렬 동일성을 보장하지 않는 직접 구성 사례입니다.
- 기대값·공분산: [MIT 18.05 Reading 7b](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_class07-prep-b_pdf/), PDF p1의 분산·공분산 항등식. 동전 하나의 상보 지시변수로 검산했습니다.
- 복사: [Python copy](https://docs.python.org/3/library/copy.html), 얕은 복사의 내부 참조 공유. 리스트 사례를 별도로 추적했습니다.
- 최단경로: [MIT 6.006 Lecture 16](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/mit6_006f11_lec16/), PDF의 비음수 가중치 가정. 세 정점 반례는 직접 구성했습니다.
- 0/1 배낭: [MIT 6.006 Lecture 21](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/mit6_006f11_lec21/), 물건 단계와 남은 용량 상태. 한 물건 사례에서 두 반복 방향을 직접 실행했습니다.
- 외부 조인: [PostgreSQL Joins Between Tables](https://www.postgresql.org/docs/current/tutorial-join.html). ON/WHERE 반례는 작은 표를 메모리 SQLite에서도 실행해 확인합니다. PostgreSQL 서버 실행은 아닙니다.
- Git 기반: [git-merge-base 공식 문서](https://git-scm.com/docs/git-merge-base), 최선 공통 조상·복수 기반·--all. O/A/B/X/Y DAG는 직접 구성했습니다.

목록/본문·위 명시한 PDF를 브라우징해 개념을 확인했습니다. 교재 전체 검토나 전문가 난이도 평가, 모든 가능한 사례의 인증을 뜻하지 않습니다.
