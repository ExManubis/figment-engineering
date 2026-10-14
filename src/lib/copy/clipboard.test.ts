import { describe, expect, it, vi } from 'vitest';
import { copyText } from './clipboard';

describe('copyText', () => {
  it('copies and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyText('brew install x', { writeText })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('brew install x');
  });
  it('reports failure when the clipboard rejects (denied, insecure context)', async () => {
    await expect(copyText('x', { writeText: () => Promise.reject(new Error('denied')) })).resolves.toBe(false);
  });
  it('reports failure when there is no clipboard API', async () => {
    await expect(copyText('x', undefined)).resolves.toBe(false);
  });
});
