import { ProjectState, PropertyTrack, TimelineClip } from '../../types/editor';
import { sampleMotion } from './motion';

export function trackingToKeyframes(
  sourceClip: TimelineClip,
  targetClip: TimelineClip,
  project: ProjectState
): PropertyTrack[] {
  const tracking = sourceClip.vfx?.tracking;
  if (!tracking || !tracking.samples.length) {
    return targetClip.keyframes || [];
  }

  // Generate X and Y property tracks mapped to destination clip local time
  const xKeys = tracking.samples.map((s, idx) => ({
    id: `tk-x-${idx}`,
    time: Number((s.time - sourceClip.trimStart).toFixed(3)),
    value: Number(((s.x - 0.5) * 100).toFixed(2)),
    easing: 'ease-in-out' as const,
  }));

  const yKeys = tracking.samples.map((s, idx) => ({
    id: `tk-y-${idx}`,
    time: Number((s.time - sourceClip.trimStart).toFixed(3)),
    value: Number(((s.y - 0.5) * 100).toFixed(2)),
    easing: 'ease-in-out' as const,
  }));

  const others = (targetClip.keyframes || []).filter(
    (t) => t.property !== 'x' && t.property !== 'y'
  );

  return [
    ...others,
    { property: 'x', keyframes: xKeys },
    { property: 'y', keyframes: yKeys },
  ];
}
