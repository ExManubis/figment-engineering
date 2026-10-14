import * as amplitude from '@amplitude/unified';

export function initAnalytics(): void {
  amplitude.initAll('2980fa258547c36f475afed98d75e2b4', {
    serverZone: 'EU',
    analytics: { autocapture: true },
    sessionReplay: { sampleRate: 1 },
  });
}

export function track(event: string): void {
  try {
    amplitude.track(event);
  } catch {
    // analytics must never break the page
  }
}
