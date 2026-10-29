import { NormalizedRect, TimelineClip } from '../../types/editor';

export function cleanupRectAtTime(clip: TimelineClip, sourceTime: number): NormalizedRect | undefined {
  return clip.vfx?.cleanup?.rect;
}

export class SourceEffectsProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  process(
    source: HTMLVideoElement | HTMLImageElement,
    width: number,
    height: number,
    clip: TimelineClip,
    sourceTime: number,
    targetWidth: number
  ): HTMLCanvasElement {
    const ratio = height / width;
    const targetHeight = Math.round(targetWidth * ratio);
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    if (!this.ctx) return this.canvas;

    this.ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    // Apply background removal or cleanup if enabled
    const vfx = clip.vfx;
    if (vfx?.background?.enabled) {
      // Background tint/key visualization
      this.ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
      this.ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    if (vfx?.cleanup?.enabled && vfx.cleanup.rect) {
      const r = vfx.cleanup.rect;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(r.x * targetWidth, r.y * targetHeight, r.width * targetWidth, r.height * targetHeight);
    }

    return this.canvas;
  }
}
