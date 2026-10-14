import { describe, expect, it, vi } from 'vitest';
import { grey, paintCells, setupCanvas } from './paint';

function fakeCtx() {
  return {
    fillStyle: '', globalAlpha: 1,
    fillRect: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(),
  } as unknown as CanvasRenderingContext2D & Record<string, ReturnType<typeof vi.fn>>;
}

describe('grey', () => {
  it('maps 0..1 onto a dark-to-light ramp, monotonically', () => {
    expect(grey(0)).toBe('rgb(28,28,28)');
    expect(grey(1)).toBe('rgb(242,242,242)');
    expect(grey(-3)).toBe(grey(0));
    const g = (v: number) => Number(grey(v).match(/\d+/)![0]);
    expect(g(0.3)).toBeLessThan(g(0.6));
  });
});

describe('paintCells', () => {
  it('fills the background, then one square per lit cell', () => {
    const ctx = fakeCtx();
    paintCells(ctx, { cols: 3, rows: 1, cell: 2, square: true }, [{ cov: 1, lum: 1 }, undefined, { cov: 1, lum: 0.5 }]);
    expect(ctx.fillRect).toHaveBeenCalledTimes(3);
  });

  it('clears instead of filling when the background is transparent', () => {
    const ctx = fakeCtx();
    paintCells(ctx, { cols: 1, rows: 1, cell: 4, background: null }, [undefined]);
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it('draws round dots by default', () => {
    const ctx = fakeCtx();
    paintCells(ctx, { cols: 2, rows: 1, cell: 4 }, [{ cov: 1, lum: 1 }, { cov: 0.5, lum: 1 }]);
    expect(ctx.arc).toHaveBeenCalledTimes(2);
  });
});

describe('setupCanvas', () => {
  it('keeps the inline width but lets height follow the aspect ratio, so a CSS max-width scales both', () => {
    vi.stubGlobal('window', { devicePixelRatio: 2 });
    const ctx = { setTransform: vi.fn() };
    const canvas = { width: 0, height: 0, style: {} as Record<string, string>, getContext: () => ctx } as unknown as HTMLCanvasElement;
    expect(setupCanvas(canvas, 200, 100)).toBe(ctx);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(200);
    expect(canvas.style.width).toBe('200px');
    expect(canvas.style.height).toBe('auto');
    expect(canvas.style.aspectRatio).toBe('200 / 100');
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    vi.unstubAllGlobals();
  });
});
