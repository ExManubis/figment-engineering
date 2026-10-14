import { describe, expect, it } from 'vitest';
import { frameAt, LOOP_MS, STILL_MS, TABS } from './timeline';

const tab = (ms: number, id: string) => frameAt(ms).tabs.find((t) => t.id === id)!;

describe('agents timeline', () => {
  it('starts with claude working and no notification', () => {
    expect(tab(0, 'claude').state).toBe('working');
    expect(frameAt(0).toast).toBe(false);
  });

  it('stills on claude needing permission, with the notification up', () => {
    expect(tab(STILL_MS, 'claude').state).toBe('permission');
    expect(frameAt(STILL_MS).toast).toBe(true);
  });

  it('shows the notification exactly while claude needs permission', () => {
    for (let ms = 0; ms < LOOP_MS; ms += 250) {
      expect(frameAt(ms).toast).toBe(tab(ms, 'claude').state === 'permission');
    }
  });

  it('ends the loop with claude done, then starts over', () => {
    expect(tab(LOOP_MS - 1, 'claude').state).toBe('done');
    expect(frameAt(LOOP_MS + 1234)).toEqual(frameAt(1234));
  });

  it('leaves a tab without an agent stateless', () => {
    expect(tab(STILL_MS, 'dev').state).toBeNull();
  });

  it('defines every agent from the start of the loop, in order', () => {
    for (const t of TABS) {
      if (!t.steps) continue;
      expect(t.steps[0].at).toBe(0);
      for (let i = 1; i < t.steps.length; i++) expect(t.steps[i].at).toBeGreaterThan(t.steps[i - 1].at);
      expect(t.steps.at(-1)!.at).toBeLessThan(LOOP_MS);
    }
  });

  it('only ever appends to the pane within a loop', () => {
    let prev = frameAt(0).pane;
    for (let ms = 100; ms < LOOP_MS; ms += 100) {
      const pane = frameAt(ms).pane;
      expect(pane.slice(0, prev.length)).toEqual(prev);
      prev = pane;
    }
  });
});
