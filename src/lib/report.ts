/** Report an error from an animation or mount that failed and fell back; the page carries on. */
export function reportError(err: unknown): void {
  console.error(err);
}
