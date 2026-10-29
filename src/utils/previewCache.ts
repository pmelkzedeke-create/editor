import { MediaAsset, ProjectState, TimelineClip, Track } from '../types/editor';
import { MediaElementPool, RenderedClipBounds, renderFrameToCanvas } from './compositor';

export interface PreviewFrameCache {
  has: (time: number) => boolean;
  peek: (time: number) => ImageBitmap | null;
  decode: (index: number) => Promise<ImageBitmap | null>;
  frameIndex: (time: number) => number;
  bounds: (time: number) => RenderedClipBounds[];
  prefetch: (time: number) => void;
}

export class PreviewCacheManager {
  private cache = new Map<number, { bitmap: ImageBitmap; bounds: RenderedClipBounds[] }>();
  private maxFrames = 600;

  has(time: number): boolean {
    const idx = Math.round(time * 30);
    return this.cache.has(idx);
  }

  peek(time: number): ImageBitmap | null {
    const idx = Math.round(time * 30);
    return this.cache.get(idx)?.bitmap || null;
  }

  async decode(index: number): Promise<ImageBitmap | null> {
    const item = this.cache.get(index);
    return item ? item.bitmap : null;
  }

  frameIndex(time: number): number {
    return Math.round(time * 30);
  }

  bounds(time: number): RenderedClipBounds[] {
    const idx = Math.round(time * 30);
    return this.cache.get(idx)?.bounds || [];
  }

  prefetch(time: number) {
    // Background prefetch
  }

  clear() {
    for (const item of this.cache.values()) {
      item.bitmap.close();
    }
    this.cache.clear();
  }
}

export async function prepareMediaFrame(
  project: ProjectState & { tracks: Track[]; clips: TimelineClip[] },
  assetsMap: Map<string, MediaAsset>,
  pool: MediaElementPool,
  time: number,
  signal: AbortSignal
): Promise<void> {
  // Preload video/image frame if needed
  if (signal.aborted) return;
}

export async function seekVideoFrame(
  video: HTMLVideoElement,
  time: number,
  signal: AbortSignal
): Promise<void> {
  if (signal.aborted) return;
  video.currentTime = time;
  await new Promise((resolve) => {
    video.onseeked = () => resolve(true);
    setTimeout(() => resolve(true), 250);
  });
}
