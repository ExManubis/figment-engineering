import figlet from 'figlet';

/** ANSI Shadow FIGlet art, generated at build time. */
export function ansiShadow(text: string): string {
  const lines = figlet
    .textSync(text.toUpperCase(), { font: 'ANSI Shadow' })
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

/** ANSI Shadow with each letter set on its own, `gap` blank columns apart, so no two letters touch. */
export function ansiShadowSpaced(text: string, gap: number): string {
  const letters = Array.from(text).map((c) => ansiShadow(c).split('\n'));
  const rows = Math.max(...letters.map((l) => l.length));
  const widths = letters.map((l) => Math.max(...l.map((line) => Array.from(line).length)));
  return [...Array(rows).keys()]
    .map((r) => letters.map((l, i) => (l[r] ?? '').padEnd(widths[i])).join(' '.repeat(gap)).replace(/\s+$/, ''))
    .join('\n');
}
