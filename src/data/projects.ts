export type DemoId = 'claudewitz';

export interface ProjectLink {
  label: string;
  href?: string;
  /** text copied to the clipboard instead of navigating */
  copy?: string;
  /** analytics event fired on success */
  event?: string;
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
      { label: '$ brew install exmanubis/tap/claudewitz', copy: 'brew install exmanubis/tap/claudewitz', event: 'install_command_copied' },
    ],
    demo: 'claudewitz',
  },
];

export const frameLabel = (index: number, name: string): string => `${String(index + 1).padStart(2, '0')} / ${name.toUpperCase()}`;
