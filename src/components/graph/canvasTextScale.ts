"use client";

/**
 * Detect if the current device/browser applies extra text scaling to canvas
 * text rendering (common on mobile browsers with accessibility font size
 * settings). Returns a factor to divide font sizes by to compensate.
 *
 * On a "normal" desktop device this returns 1.0. On a device that renders
 * text ~15% wider, this returns ~1.15.
 */
let _canvasTextScale: number | null = null;
let _fontLoadChecked = false;

export function resetCanvasTextScale() {
  _canvasTextScale = null;
}

export function getCanvasTextScale(): number {
  if (_canvasTextScale !== null) return _canvasTextScale;

  // Wait for fonts on first call (non-blocking; on subsequent frames the
  // cached value will be used)
  if (!_fontLoadChecked && typeof document !== "undefined") {
    _fontLoadChecked = true;
    document.fonts?.ready?.then(() => {
      _canvasTextScale = null; // invalidate so next frame recalculates with loaded fonts
    });
  }

  try {
    if (typeof document === "undefined") {
      _canvasTextScale = 1;
      return 1;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      _canvasTextScale = 1;
      return 1;
    }

    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|SamsungBrowser/i.test(
        navigator.userAgent
      );

    if (!isMobile) {
      _canvasTextScale = 1;
      return 1;
    }

    // On mobile: measure how wide an 'M' renders at two different sizes and
    // compare to expected values. Samsung Internet and Chrome Android can
    // inflate canvas text due to system accessibility font scaling.

    const testSize = 100;
    ctx.font = `${testSize}px sans-serif`;
    const mWidth = ctx.measureText("M").width;

    ctx.font = `${testSize / 2}px sans-serif`;
    const halfMWidth = ctx.measureText("M").width;

    // The ratio should be exactly 2.0 for linear rendering
    const ratio = mWidth / halfMWidth;

    if (Math.abs(ratio - 2.0) > 0.01) {
      // Non-linear scaling detected
      _canvasTextScale = ratio / 2.0;
    } else {
      // Linear scaling — detect by checking if standard char widths are inflated.
      ctx.font = `16px sans-serif`;
      const w16 = ctx.measureText("MMMMMMMMMM").width; // 10 M's
      const expectedPerM = 11.5; // typical sans-serif M-width at 16px
      const expected10M = expectedPerM * 10;

      if (w16 > expected10M * 1.05) {
        _canvasTextScale = w16 / expected10M;
      } else {
        _canvasTextScale = 1;
      }
    }

    // Clamp to [1.0, 1.4] — never scale up, cap reduction at 40%
    if (_canvasTextScale < 1) _canvasTextScale = 1;
    if (_canvasTextScale > 1.4) _canvasTextScale = 1.4;
  } catch {
    _canvasTextScale = 1;
  }

  return _canvasTextScale;
}
