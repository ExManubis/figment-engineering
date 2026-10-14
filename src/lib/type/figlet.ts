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
