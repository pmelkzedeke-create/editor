import { EasingName, PropertyKeyframe } from '../types/editor';

export interface SavedCurvePreset {
  id: string;
  name: string;
  favorite: boolean;
  outHandle: { x: number; y: number };
  inHandle: { x: number; y: number };
}

export const DEFAULT_OUT_HANDLE = { x: 0.25, y: 0.1 };
export const DEFAULT_IN_HANDLE = { x: 0.75, y: 0.9 };

export const EASING_PRESETS: { id: EasingName; label: string; outHandle: { x: number; y: number }; inHandle: { x: number; y: number } }[] = [
  { id: 'linear', label: 'Linear', outHandle: { x: 0.25, y: 0.25 }, inHandle: { x: 0.75, y: 0.75 } },
  { id: 'ease', label: 'Ease (Padrão)', outHandle: { x: 0.25, y: 0.1 }, inHandle: { x: 0.75, y: 0.9 } },
  { id: 'ease-in', label: 'Ease In', outHandle: { x: 0.42, y: 0 }, inHandle: { x: 1, y: 1 } },
  { id: 'ease-out', label: 'Ease Out', outHandle: { x: 0, y: 0 }, inHandle: { x: 0.58, y: 1 } },
  { id: 'ease-in-out', label: 'Ease In Out', outHandle: { x: 0.42, y: 0 }, inHandle: { x: 0.58, y: 1 } },
  { id: 'bezier', label: 'Bézier Personalizada', outHandle: { x: 0.25, y: 0.8 }, inHandle: { x: 0.75, y: 0.2 } },
];

export function invertCurveValues(keyframes: PropertyKeyframe[]): PropertyKeyframe[] {
  const vals = keyframes.map((k) => k.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  return keyframes.map((k) => ({
    ...k,
    value: min + (max - k.value),
  }));
}

export function mirrorCurveTiming(keyframes: PropertyKeyframe[]): PropertyKeyframe[] {
  if (keyframes.length === 0) return keyframes;
  const maxT = keyframes[keyframes.length - 1].time;
  return keyframes.map((k) => ({
    ...k,
    time: Number((maxT - k.time).toFixed(3)),
  })).sort((a, b) => a.time - b.time);
}

export function smoothCurveKeyframes(keyframes: PropertyKeyframe[], selectedIds: Set<string>): PropertyKeyframe[] {
  return keyframes.map((k) =>
    selectedIds.size === 0 || selectedIds.has(k.id)
      ? {
          ...k,
          easing: 'bezier',
          outHandle: { x: 0.33, y: 0.33 },
          inHandle: { x: 0.33, y: 0.33 },
        }
      : k
  );
}

export function scaleCurveIntensity(keyframes: PropertyKeyframe[], factor: number): PropertyKeyframe[] {
  if (keyframes.length === 0) return keyframes;
  const mid = keyframes[0].value;
  return keyframes.map((k) => ({
    ...k,
    value: Number((mid + (k.value - mid) * factor).toFixed(2)),
  }));
}
