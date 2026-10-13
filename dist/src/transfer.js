// Original self-review tasks; separate from seeded banks, scoring and persistence.
export const TRANSFER = {
  numbers: {
    title: '곱의 나머지에서 인수로 돌아갈 수 있을까?',
    source: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/pages/readings/',
    prompt: '6 | ab이면 6 | a 또는 6 | b라는 주장을 반박하세요. 양의 정수 반례를 쓰고, 6 대신 소수 p를 쓰면 무엇이 달라지는지 설명해보세요.',
    rubric: ['a=2, b=3이면 ab=6이지만 어느 인수도 6의 배수가 아닙니다.', '소수 p에서는 p | ab이면 p | a 또는 p | b입니다. p가 a를 나누지 않으면 gcd(a,p)=1을 사용해 증명할 수 있습니다.', '합성수의 서로 다른 소인수가 두 인수로 나뉠 수 있다는 점이 반례의 핵심입니다.'],
  },
  calculus: {
    title: '정지점과 최솟값을 구별하기',
    source: 'https://openstax.org/books/calculus-volume-1/pages/4-3-maxima-and-minima',
    prompt: '“f′(c)=0이면 c는 최솟값”을 반박하세요. f(x)=x³과 f(x)=x²를 x=0에서 비교하고, 닫힌 구간의 전역 최솟값을 구할 때 필요한 후보를 적으세요.',
    rubric: ['두 함수 모두 0에서 도함수가 0입니다. x³은 0을 지나 계속 증가하므로 극값이 아닙니다.', 'x²은 0 좌우에서 도함수 부호가 음→양으로 바뀌며 최솟값을 갖습니다.', '닫힌 구간에서 연속이면 전역 극값이 존재합니다. 끝점, 내부 정지점, 미분 불가능한 내부점을 함께 비교합니다.'],
  },
  probability: {
    title: '기대값의 덧셈에 독립이 필요할까?',
    source: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_class07-prep-b_pdf/',
    prompt: '공정한 동전 한 번에서 앞면이면 X=1, 아니면 0이고 Y=1−X입니다. E(X+Y)와 Var(X+Y)를 구한 뒤, “기대값을 더할 수 있으니 분산도 더한다”의 오류를 설명하세요.',
    rubric: ['X+Y=1이 항상 성립하므로 기대값 1, 분산 0입니다.', 'E(X)+E(Y)=1/2+1/2=1입니다. 기댓값의 선형성에는 독립이 필요하지 않습니다.', '각 분산은 1/4이고 Cov(X,Y)=−1/4입니다. 분산에는 2Cov 항이 있어 합계가 0이 됩니다.'],
  },
  linear: {
    title: '성분 합이 같아도 같은 벡터일까?',
    source: 'https://textbooks.math.gatech.edu/ila/matrix-multiplication.html',
    prompt: 'u=(1,−1), v=(0,0)은 성분 합이 같습니다. 이를 이용해 “ABx와 BAx의 성분 합이 같으면 AB=BA”를 반박하는 2×2 행렬 A,B와 벡터 x를 구성하세요.',
    rubric: ['A=[[1,0],[0,0]], B=[[0,1],[1,0]], x=(1,1)을 택할 수 있습니다.', 'ABx=(1,0), BAx=(0,1)입니다. 합은 모두 1이지만 두 결과는 다릅니다.', '행렬이 같으려면 모든 입력에 대한 출력이 같아야 합니다. 한 입력의 합이라는 요약만으로는 부족합니다.'],
  },
  logic: {
    title: '한 사람이 모두를 돕는 것과 각자 도움을 받는 것',
    source: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/pages/readings/',
    prompt: '사람 A,B만 있고 “돕는다”는 관계가 A→B, B→A뿐입니다. ∀y∃x R(x,y)와 ∃x∀y R(x,y)의 참·거짓을 판단하고 양화사 순서가 바꾸는 것을 설명하세요.',
    rubric: ['각 사람 y마다 다른 사람이 도우므로 ∀y∃x R(x,y)는 참입니다.', 'A는 A를, B는 B를 돕지 않습니다. 모두를 돕는 한 명이 없으므로 ∃x∀y R(x,y)는 거짓입니다.', '첫 식의 x는 y에 따라 달라질 수 있습니다. 두 번째 식은 모든 y에 대해 같은 x를 요구합니다.'],
  },
  code: {
    title: '복사했는데 왜 원본도 바뀔까?',
    prompt: 'Python에서 a=[[1],[2]], b=a.copy() 뒤 b[0].append(9); b.append([3])를 실행합니다. 최종 a,b를 적고 공유되는 객체와 별개인 객체를 구분하세요.',
    rubric: ['a=[[1,9],[2]], b=[[1,9],[2],[3]]입니다.', '바깥 리스트는 서로 다르므로 b.append([3])은 a의 길이를 바꾸지 않습니다.', '안쪽 리스트는 같은 참조를 공유합니다. 내부 변경까지 독립적으로 만들려면 이 자료에서는 deepcopy 또는 안쪽 리스트별 복사가 필요합니다.'],
    source: 'https://docs.python.org/3/library/copy.html',
  },
  algorithms: {
    title: '음수 간선이 확정 순서를 깨뜨리는 순간',
    prompt: '방향 간선 S→A=2, S→B=5, B→A=−4만 있습니다. 방문 정점을 다시 열지 않는 Dijkstra가 A를 확정할 때 어떤 오류가 생길까요? 최단경로와 실패한 가정을 적으세요.',
    rubric: ['A를 거리 2로 먼저 확정하지만 S→B→A의 길이는 5−4=1입니다.', '아직 확정하지 않은 정점을 경유해 더 짧아질 수 있습니다. 음수 간선에서는 확정된 거리가 다시 줄지 않는다는 보장이 깨집니다.', '음수 사이클이 없는 이 예에서는 Bellman–Ford 같은 음수 간선 지원 알고리즘을 쓸 수 있습니다. “음수 사이클 없음”만으로 Dijkstra가 보장되지는 않습니다.'],
    source: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/mit6_006f11_lec16/',
  },
  database: {
    title: 'LEFT JOIN 뒤 WHERE가 남기는 행',
    prompt: 'L(id)={1,2}, R(id,flag)={(1,1)}입니다. L LEFT JOIN R ON L.id=R.id 뒤 WHERE R.flag=1을 붙인 결과와, flag 조건을 ON에 넣은 결과의 행 수를 비교하세요.',
    rubric: ['WHERE 조건을 붙이면 id=2의 확장 행에서 R.flag는 NULL입니다. NULL=1은 참이 아니므로 남는 행은 1개입니다.', 'ON L.id=R.id AND R.flag=1이면 왼쪽의 id=2도 NULL 확장 행으로 남아 2개입니다.', 'ON은 연결되는 오른쪽 행을 제한하고 WHERE는 연결 후 결과를 거릅니다. 같은 조건이라도 외부 조인에서는 위치가 중요합니다.'],
    source: 'https://www.postgresql.org/docs/current/tutorial-join.html',
  },
  git: {
    title: '공통 조상과 병합 기반의 차이',
    prompt: 'A,B는 각각 O의 자식이고, X와 Y는 둘 다 A,B를 부모로 둔 서로 다른 병합 커밋입니다. X,Y의 최선 공통 조상을 모두 찾고 O가 병합 기반에서 빠지는 이유를 설명하세요.',
    rubric: ['A,B,O가 공통 조상입니다. A와 B는 서로의 조상이 아니므로 두 최선 공통 조상입니다.', 'O는 A와 B의 조상이므로 더 나은 공통 조상에 가려집니다.', 'git merge-base --all X Y로 둘 다 요청할 수 있습니다. --all이 없으면 여러 기반 중 어느 하나가 나올지는 지정되지 않습니다. 커밋 시각의 최신순 문제가 아닙니다.'],
    source: 'https://git-scm.com/docs/git-merge-base',
  },
  recurrences: {
    title: '0/1 배낭의 반복 방향은 왜 중요할까?',
    prompt: '무게 2, 가치 3인 물건이 딱 하나이고 용량은 4입니다. dp를 모두 0으로 시작해 c=2,3,4 순서로 dp[c]=max(dp[c],dp[c−2]+3)을 제자리 갱신하면 어떤 잘못된 답을 낼까요? 올바른 갱신 방향의 이유를 쓰세요.',
    rubric: ['오름차순에서는 dp[2]=3을 새로 쓴 뒤 dp[4]=dp[2]+3=6이 됩니다. 한 물건을 두 번 쓴 값입니다.', '0/1 배낭의 실제 최댓값은 3입니다. 용량을 4→2 내림차순으로 돌면 이전 물건 단계의 dp[c−2]를 읽습니다.', '상태에 “지금까지 고려한 물건”이 숨어 있습니다. 같은 단계의 새 값을 읽으면 무제한 배낭의 의미로 바뀝니다.'],
    source: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/resources/mit6_006f11_lec21/',
  },
};
