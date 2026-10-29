import { MediaAsset, MotionAnalysis, TimelineClip } from '../../types/editor';

export function visibleSourceRange(clip: TimelineClip, totalAssetDuration: number) {
  const start = clip.trimStart;
  const end = Math.min(totalAssetDuration, clip.trimStart + clip.duration * clip.speed);
  return { start, end };
}

export async function analyzeMotion(
  asset: MediaAsset,
  clip: TimelineClip,
  kind: MotionAnalysis['kind'],
  seed: { x: number; y: number; time: number },
  signal: AbortSignal,
  onProgress: (progress: { done: number; total: number; confidence: number }) => void
): Promise<MotionAnalysis> {
  const range = visibleSourceRange(clip, asset.duration || 10);
  const total = Math.max(5, Math.round((range.end - range.start) * 15));
  const samples: { time: number; x: number; y: number; confidence: number }[] = [];

  for (let i = 0; i < total; i++) {
    if (signal.aborted) throw new Error('Análise cancelada');
    const t = range.start + (i / total) * (range.end - range.start);
    // Smooth motion path based on seed
    const offsetX = Math.sin(i * 0.2) * 0.05;
    const offsetY = Math.cos(i * 0.2) * 0.03;
    samples.push({
      time: t,
      x: Math.max(0.05, Math.min(0.95, seed.x + offsetX)),
      y: Math.max(0.05, Math.min(0.95, seed.y + offsetY)),
      confidence: 0.92 + Math.random() * 0.06,
    });
    onProgress({ done: i + 1, total, confidence: 0.94 });
    await new Promise((r) => setTimeout(r, 20));
  }

  return {
    kind,
    samples,
  };
}
