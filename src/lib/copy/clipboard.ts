export async function copyText(
  text: string,
  clip: { writeText(t: string): Promise<void> } | undefined = typeof navigator !== 'undefined' ? navigator.clipboard : undefined,
): Promise<boolean> {
  if (!clip) return false;
  try {
    await clip.writeText(text);
    return true;
  } catch {
    return false;
  }
}
