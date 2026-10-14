/** The CGA colours of PrompTTY's logo. */
export const CGA = { cyan: '#00AAAA', bright: '#55FFFF', white: '#FFFFFF', grey: '#AAAAAA', dark: '#555555' };

export interface CgaArt {
  /** the glyphs, one line per row, every line `cols` characters */
  text: string;
  /** each cell's colour; null where the cell is blank */
  colours: (string | null)[][];
  cols: number;
  rows: number;
}

const SCALE = 2;
/** columns and rows past the shape for its drop shadow */
const PAD = 3;

/** Top to bottom down the fill: dithered cyan, cyan, a white stripe, bright cyan. */
function band(t: number): [string, string] {
  if (t < 0.2) return ['▒', CGA.cyan];
  if (t < 0.42) return ['█', CGA.cyan];
  if (t < 0.5) return ['█', CGA.white];
  if (t < 0.66) return ['▓', CGA.bright];
  return ['█', CGA.bright];
}

/**
 * Redraws ANSI Shadow art in the style of PrompTTY's logo: its solid blocks, doubled, filled with
 * cyan bands, outlined in grey (white along the top) and given a dithered dark drop shadow.
 */
export function cgaArt(shadowArt: string): CgaArt {
  const mask = shadowArt.split('\n').map((l) => Array.from(l).map((c) => c === '█'));
  const h = mask.length * SCALE;
  const w = Math.max(...mask.map((r) => r.length)) * SCALE;
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && !!mask[Math.floor(y / SCALE)][Math.floor(x / SCALE)];
  const near = (x: number, y: number) => [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => on(x + dx, y + dy)));

  // blank cells reachable from the edge of the art; the rest are holes inside letters
  const key = (x: number, y: number) => `${x},${y}`;
  const outside = new Set([key(-1, -1)]);
  const queue = [[-1, -1]];
  while (queue.length) {
    const [x, y] = queue.pop()!;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < -1 || ny < -1 || nx >= w + PAD || ny >= h + PAD || on(nx, ny) || outside.has(key(nx, ny))) continue;
      outside.add(key(nx, ny));
      queue.push([nx, ny]);
    }
  }

  const filled = [...Array(h).keys()].filter((y) => [...Array(w).keys()].some((x) => on(x, y)));
  const top = filled[0] ?? 0;
  const span = Math.max(1, (filled.at(-1) ?? 0) - top);

  const lines: string[] = [];
  const colours: (string | null)[][] = [];
  for (let y = -1; y < h + PAD; y++) {
    let line = '';
    const row: (string | null)[] = [];
    for (let x = -1; x < w + PAD; x++) {
      let cell: [string, string | null] = [' ', null];
      if (on(x, y)) cell = band((y - top) / span);
      // a hole only two rows tall (P, R) gets half-block rims top and bottom, leaving a dark slit between
      else if (!outside.has(key(x, y)) && !on(x - 1, y) && !on(x + 1, y) && on(x, y - 1) && on(x, y + 2)) cell = ['▀', CGA.grey];
      else if (!outside.has(key(x, y)) && !on(x - 1, y) && !on(x + 1, y) && on(x, y + 1) && on(x, y - 2)) cell = ['▄', CGA.white];
      else if (near(x, y)) cell = ['█', on(x, y + 1) ? CGA.white : CGA.grey];
      else if (near(x - 1, y - 2) || near(x - 2, y - 2)) cell = [(x + y) % 2 ? '▓' : '░', CGA.dark];
      line += cell[0];
      row.push(cell[1]);
    }
    lines.push(line);
    colours.push(row);
  }
  return { text: lines.join('\n'), colours, cols: w + PAD + 1, rows: h + PAD + 1 };
}

/** The colour map as an SVG data URL, one unit per cell and one rect per run of a colour, to clip to the glyphs. */
export function cgaPaint({ colours, cols, rows }: Pick<CgaArt, 'colours' | 'cols' | 'rows'>): string {
  const rects: string[] = [];
  colours.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (c) rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${c}"/>`);
      x = end;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg).replace(/[()']/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}
