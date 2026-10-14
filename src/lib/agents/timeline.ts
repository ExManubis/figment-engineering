export type AgentState = 'working' | 'permission' | 'done';

export interface Step { at: number; state: AgentState; detail: string }

export interface AgentTab {
  id: string;
  name: string;
  project: string;
  /** an agent's states over one loop, from 0; omitted for a plain program */
  steps?: Step[];
}

export type Tone = 'add' | 'del' | 'warn' | 'muted';
export interface PaneLine { at: number; text: string; tone?: Tone }

export const LOOP_MS = 12000;
/** the frame shown without motion: claude waiting on you, the notification up */
export const STILL_MS = 4500;

export const TABS: AgentTab[] = [
  {
    id: 'claude', name: 'claude', project: 'figment-engineering', steps: [
      { at: 0, state: 'working', detail: 'editing Hero.astro' },
      { at: 3500, state: 'permission', detail: 'wants to run Bash' },
      { at: 6500, state: 'working', detail: 'running tests' },
      { at: 9000, state: 'done', detail: '2 files changed' },
    ],
  },
  { id: 'dev', name: 'npm run dev', project: 'figment-engineering' },
  {
    id: 'claudewitz', name: 'claudewitz', project: 'promptty', steps: [
      { at: 0, state: 'working', detail: 'reading Sources/' },
      { at: 5000, state: 'done', detail: 'answered' },
      { at: 7500, state: 'working', detail: 'planning a fix' },
    ],
  },
  {
    id: 'codex', name: 'codex', project: 'promptty', steps: [
      { at: 0, state: 'done', detail: 'done' },
      { at: 2000, state: 'working', detail: 'writing README.md' },
      { at: 10500, state: 'done', detail: 'done' },
    ],
  },
];

/** claude's session in the main pane */
export const PANE: PaneLine[] = [
  { at: 0, text: '✻ Editing src/components/index/Hero.astro' },
  { at: 500, text: '+ <h1 class="motto">', tone: 'add' },
  { at: 700, text: '- <h1>', tone: 'del' },
  { at: 3500, text: '? Allow Bash: npm test', tone: 'warn' },
  { at: 6500, text: '  allowed', tone: 'muted' },
  { at: 6600, text: '✻ Running npm test' },
  { at: 8200, text: '  42 passed', tone: 'add' },
  { at: 9000, text: '✻ Done. 2 files changed.' },
];

export interface TabFrame { id: string; state: AgentState | null; detail: string }
export interface Frame { tabs: TabFrame[]; toast: boolean; pane: PaneLine[] }

/** Everything on screen `ms` milliseconds into the demo; it loops every LOOP_MS. */
export function frameAt(ms: number): Frame {
  const t = ((ms % LOOP_MS) + LOOP_MS) % LOOP_MS;
  const tabs = TABS.map(({ id, steps }) => {
    const step = steps?.findLast((s) => s.at <= t);
    return { id, state: step?.state ?? null, detail: step?.detail ?? '' };
  });
  return {
    tabs,
    toast: tabs.find((x) => x.id === 'claude')?.state === 'permission',
    pane: PANE.filter((l) => l.at <= t),
  };
}
