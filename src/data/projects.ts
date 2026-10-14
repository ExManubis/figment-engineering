export type DemoId = 'claudewitz' | 'promptty';

export interface ProjectLink {
  label: string;
  href?: string;
  /** text copied to the clipboard instead of navigating */
  copy?: string;
}

export interface Project {
  id: string;
  /** display name; also the ANSI header text */
  name: string;
  /** primary is the solid brand colour; gradient, when set, runs left → right across the ANSI header and the frame instead */
  brand: { primary: string; secondary?: string; gradient?: [string, string] };
  description: string;
  /** 3–4 short lines */
  features: string[];
  links: ProjectLink[];
  /** cga: the header redrawn in the style of the project's logo; default ANSI Shadow in the brand gradient */
  header?: 'cga';
  /** short muted line beside the links, e.g. system requirements */
  note?: string;
  demo: DemoId;
}

export const projects: Project[] = [
  {
    id: 'claudewitz',
    name: 'Claudewitz',
    brand: { primary: '#DA7756', secondary: '#B497FF', gradient: ['#DA702C', '#3AA99F'] },
    description: 'A Crush-style terminal UI for Claude Code that runs on the subscription you already have.',
    features: [
      'Drives the claude CLI, so Claude Code\'s tools, MCP servers, skills and hooks just work.',
      'Streams Markdown, thinking and tool calls as they happen.',
      'Syntax-highlighted, side-by-side diffs for every edit.',
      'Images drawn inline, in colour, with half blocks.',
    ],
    links: [
      { label: 'GitHub', href: 'https://github.com/ExManubis/Claudewitz' },
      { label: '$ brew install exmanubis/tap/claudewitz', copy: 'brew install exmanubis/tap/claudewitz' },
    ],
    demo: 'claudewitz',
  },
  {
    id: 'promptty',
    name: 'PrompTTY',
    brand: { primary: '#00AAAA', gradient: ['#00AAAA', '#55FFFF'] },
    description: 'A native macOS terminal for working alongside coding agents, built on libghostty.',
    features: [
      'Spots Claude Code, Codex, Amp and others in any pane, and shows whether each is working, waiting or done.',
      'Notifies you the moment an agent needs your permission.',
      'In zsh, an input bar replaces the prompt, with history, suggestions and fuzzy search.',
      'Every command is a block you can jump to, copy or rerun.',
    ],
    links: [
      { label: 'GitHub', href: 'https://github.com/ExManubis/promptty' },
      { label: 'Download for macOS', href: 'https://github.com/ExManubis/promptty/releases/latest' },
    ],
    header: 'cga',
    note: 'Apple silicon · macOS 26',
    demo: 'promptty',
  },
];

export const frameLabel = (index: number, name: string): string => `${String(index + 1).padStart(2, '0')} / ${name.toUpperCase()}`;
