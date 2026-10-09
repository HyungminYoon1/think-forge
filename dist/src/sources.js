// Only the marked adapted question content is CC BY-NC-SA 4.0.
export const ORIGINAL = Object.freeze({
  kind: "original",
  creator: "THINK FORGE",
  title: "자체 제작 연습문항",
  notice: "수학·컴퓨터과학 연습문항.",
});
const base = "https://ocw.mit.edu/courses/";
export function source(course, question, changes) {
  const discrete = course === "discrete";
  const root =
    base +
    (discrete
      ? "6-042j-mathematics-for-computer-science-fall-2010/resources/"
      : "18-01sc-single-variable-calculus-fall-2010/resources/");
  return {
    kind: "adapted",
    creator: discrete ? "Tom Leighton, Eric Lehman" : "Prof. David Jerison",
    title: discrete
      ? "6.042/18.062J Final, December 14, 2004"
      : "18.01SC Single Variable Calculus, Fall 2010 — Final",
    question,
    url:
      root + (discrete ? "mit6_042jf10_final_2004/" : "mit18_01scf10_final/"),
    solutionUrl:
      root +
      (discrete ? "mit6_042jf10_fnl_2004_sol/" : "mit18_01scf10_finalsol/"),
    publisher: "MIT OpenCourseWare",
    license: "CC BY-NC-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    notice: `한국어 번안·조건 변경: ${changes} 풀이를 새로 작성했습니다. 이 파생 문항과 풀이에 CC BY-NC-SA 4.0 적용. 비상업적 이용·동일조건변경허락. MIT의 제휴·보증 없음.`,
  };
}
