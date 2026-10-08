# 검증 기록

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
