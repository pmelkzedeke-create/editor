import { TimeRemap, TimeRemapKeyframe, TimelineClip } from '../types/editor';

export type RemapPreset = 'normal' | 'ramp' | 'slow' | 'reverse' | 'freeze';

export const DEFAULT_REMAP_HANDLE = { x: 0.25, y: 0.25 };

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function createTimeRemap(clip: TimelineClip): TimeRemap {
  const max = clip.maxDuration || 10;
  return {
    enabled: false,
    sourceStart: clip.trimStart,
    sourceEnd: Math.min(max, clip.trimStart + clip.duration * clip.speed),
    keyframes: [
      { id: 'rk-1', time: 0, sourceTime: clip.trimStart, interpolation: 'linear' },
      { id: 'rk-2', time: clip.duration, sourceTime: Math.min(max, clip.trimStart + clip.duration * clip.speed), interpolation: 'linear' },
    ],
  };
}

export function getClipSourceTime(clip: TimelineClip, localTime: number): number {
  if (!clip.timeRemap?.enabled || !clip.timeRemap.keyframes.length) {
    return clamp(clip.trimStart + localTime * clip.speed, 0, clip.maxDuration || 10);
  }
  const keys = clip.timeRemap.keyframes;
  if (localTime <= keys[0].time) return keys[0].sourceTime;
  if (localTime >= keys[keys.length - 1].time) return keys[keys.length - 1].sourceTime;

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (localTime >= a.time && localTime <= b.time) {
      const p = (localTime - a.time) / Math.max(0.001, b.time - a.time);
      return a.sourceTime + p * (b.sourceTime - a.sourceTime);
    }
  }
  return clip.trimStart;
}

export function getClipPlaybackRate(clip: TimelineClip, localTime: number): number {
  if (!clip.timeRemap?.enabled) return clip.speed;
  const dt = 0.05;
  const t1 = Math.max(0, localTime - dt);
  const t2 = Math.min(clip.duration, localTime + dt);
  const s1 = getClipSourceTime(clip, t1);
  const s2 = getClipSourceTime(clip, t2);
  return (s2 - s1) / Math.max(0.001, t2 - t1);
}

export function sliceTimeRemap(clip: TimelineClip, deltaStart: number, newDuration: number): TimeRemap | undefined {
  if (!clip.timeRemap) return undefined;
  return {
    ...clip.timeRemap,
    keyframes: clip.timeRemap.keyframes.map((k) => ({
      ...k,
      time: clamp(k.time - deltaStart, 0, newDuration),
    })),
  };
}

export function insertRemapKeyframe(clip: TimelineClip, time: number, fps: number): TimeRemap {
  const remap = clip.timeRemap || createTimeRemap(clip);
  const sourceTime = getClipSourceTime(clip, time);
  const kf: TimeRemapKeyframe = {
    id: `rk-${Math.random().toString(36).slice(2, 8)}`,
    time: Number(Math.round(time * fps) / fps),
    sourceTime: Number(Math.round(sourceTime * fps) / fps),
    interpolation: 'bezier',
    outHandle: { ...DEFAULT_REMAP_HANDLE },
    inHandle: { ...DEFAULT_REMAP_HANDLE },
  };
  const keyframes = [...remap.keyframes, kf].sort((a, b) => a.time - b.time);
  return { ...remap, enabled: true, keyframes };
}

export function createRemapPreset(clip: TimelineClip, name: RemapPreset, localTime: number): TimeRemap {
  const remap = createTimeRemap(clip);
  remap.enabled = true;
  const dur = clip.duration;
  const max = clip.maxDuration || 10;

  if (name === 'ramp') {
    remap.keyframes = [
      { id: 'rk-1', time: 0, sourceTime: clip.trimStart, interpolation: 'bezier' },
      { id: 'rk-2', time: dur * 0.4, sourceTime: Math.min(max, clip.trimStart + dur * 0.2), interpolation: 'bezier' },
      { id: 'rk-3', time: dur * 0.6, sourceTime: Math.min(max, clip.trimStart + dur * 0.8), interpolation: 'bezier' },
      { id: 'rk-4', time: dur, sourceTime: Math.min(max, clip.trimStart + dur), interpolation: 'bezier' },
    ];
  } else if (name === 'slow') {
    remap.keyframes = [
      { id: 'rk-1', time: 0, sourceTime: clip.trimStart, interpolation: 'linear' },
      { id: 'rk-2', time: dur, sourceTime: Math.min(max, clip.trimStart + dur * 0.25), interpolation: 'linear' },
    ];
  } else if (name === 'reverse') {
    remap.keyframes = [
      { id: 'rk-1', time: 0, sourceTime: Math.min(max, clip.trimStart + dur), interpolation: 'linear' },
      { id: 'rk-2', time: dur, sourceTime: clip.trimStart, interpolation: 'linear' },
    ];
  } else if (name === 'freeze') {
    const st = getClipSourceTime(clip, localTime);
    remap.keyframes = [
      { id: 'rk-1', time: 0, sourceTime: clip.trimStart, interpolation: 'linear' },
      { id: 'rk-2', time: Math.max(0.1, localTime - 0.2), sourceTime: st, interpolation: 'hold' },
      { id: 'rk-3', time: Math.min(dur, localTime + 0.8), sourceTime: st, interpolation: 'linear' },
      { id: 'rk-4', time: dur, sourceTime: Math.min(max, clip.trimStart + dur), interpolation: 'linear' },
    ];
  }
  return remap;
}

export function segmentCurve(a: TimeRemapKeyframe, b: TimeRemapKeyframe) {
  const dx = b.time - a.time;
  const dy = b.sourceTime - a.sourceTime;
  const oh = a.outHandle || DEFAULT_REMAP_HANDLE;
  const ih = b.inHandle || DEFAULT_REMAP_HANDLE;
  return [
    { x: a.time, y: a.sourceTime },
    { x: a.time + dx * oh.x, y: a.sourceTime + dy * oh.y },
    { x: b.time - dx * ih.x, y: b.sourceTime - dy * ih.y },
    { x: b.time, y: b.sourceTime },
  ];
}
