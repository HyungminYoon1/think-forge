export const sum = (a) => a.reduce((s, x) => s + x, 0);
export function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
}
export function frac(a, b) {
  if (!b) throw Error("Zero denominator");
  const g = gcd(a, b) * Math.sign(b);
  return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`;
}
export function choose(n, k) {
  let a = 1;
  for (let i = 1; i <= k; i++) a = (a * (n - i + 1)) / i;
  return Math.round(a);
}
export const factorial = (n) => (n < 2 ? 1 : n * factorial(n - 1));
export function question(title, text, answer, steps, extra = {}) {
  return {
    title,
    text,
    answer: String(answer),
    steps,
    hints: [steps[0]],
    options: null,
    visual: null,
    code: false,
    ...extra,
  };
}
export const table = (head, rows) => ({ type: "table", head, rows });
