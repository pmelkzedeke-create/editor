import { MotionAnalysis } from '../../types/editor';

export function sampleMotion(tracking: MotionAnalysis, sourceTime: number): { x: number; y: number } {
  if (!tracking.samples.length) return { x: 0.5, y: 0.5 };
  const samples = tracking.samples;
  if (sourceTime <= samples[0].time) return { x: samples[0].x, y: samples[0].y };
  if (sourceTime >= samples[samples.length - 1].time) {
    const last = samples[samples.length - 1];
    return { x: last.x, y: last.y };
  }

  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    if (sourceTime >= a.time && sourceTime <= b.time) {
      const p = (sourceTime - a.time) / Math.max(0.0001, b.time - a.time);
      return {
        x: a.x + p * (b.x - a.x),
        y: a.y + p * (b.y - a.y),
      };
    }
  }

  return { x: samples[0].x, y: samples[0].y };
}
