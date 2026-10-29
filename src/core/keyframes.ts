import { AnimatableProperty, PropertyKeyframe, PropertyTrack, TimelineClip } from '../types/editor';

export const ANIMATABLE_PROPERTIES: { key: AnimatableProperty; label: string; unit: string; min: number; max: number }[] = [
  { key: 'scale', label: 'Escala (Zoom)', unit: '%', min: 0, max: 300 },
  { key: 'x', label: 'Posição X', unit: '%', min: -150, max: 150 },
  { key: 'y', label: 'Posição Y', unit: '%', min: -150, max: 150 },
  { key: 'rotation', label: 'Rotação 2D', unit: '°', min: -360, max: 360 },
  { key: 'opacity', label: 'Opacidade', unit: '%', min: 0, max: 100 },
  { key: 'strokeWidth', label: 'Espessura do Contorno', unit: 'px', min: 0, max: 50 },
  { key: 'trimStartPct', label: 'Trim Start %', unit: '%', min: 0, max: 100 },
  { key: 'trimEndPct', label: 'Trim End %', unit: '%', min: 0, max: 100 },
  { key: 'maskFeather', label: 'Máscara Feather', unit: 'px', min: 0, max: 100 },
  { key: 'maskExpansion', label: 'Máscara Expansão', unit: 'px', min: -50, max: 50 },
];

export function sortPropertyKeyframes(keyframes: PropertyKeyframe[]): PropertyKeyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

export function getClipBasePropertyValue(clip: TimelineClip, prop: AnimatableProperty): number {
  switch (prop) {
    case 'scale': return clip.scale;
    case 'scaleX': return clip.scaleX ?? clip.scale;
    case 'scaleY': return clip.scaleY ?? clip.scale;
    case 'x': return clip.x;
    case 'y': return clip.y;
    case 'z': return clip.z ?? 0;
    case 'rotation': return clip.rotation;
    case 'rotationX': return clip.rotationX ?? 0;
    case 'rotationY': return clip.rotationY ?? 0;
    case 'opacity': return clip.opacity;
    case 'strokeWidth': return clip.shapeData?.strokeWidth ?? 2;
    case 'trimStartPct': return clip.shapeData?.trimStart ?? 0;
    case 'trimEndPct': return clip.shapeData?.trimEnd ?? 100;
    case 'maskFeather': return clip.masks?.[0]?.feather ?? 0;
    case 'maskExpansion': return clip.masks?.[0]?.expansion ?? 0;
    default: return 0;
  }
}

export function evaluatePropertyTrack(
  track: PropertyTrack | undefined,
  localTime: number,
  baseValue: number
): number {
  if (!track || !track.keyframes || track.keyframes.length === 0) return baseValue;
  const keys = sortPropertyKeyframes(track.keyframes);
  if (localTime <= keys[0].time) return keys[0].value;
  if (localTime >= keys[keys.length - 1].time) return keys[keys.length - 1].value;

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (localTime >= a.time && localTime <= b.time) {
      const p = (localTime - a.time) / Math.max(0.001, b.time - a.time);
      return a.value + p * (b.value - a.value);
    }
  }
  return baseValue;
}

export function getPropertyVelocity(
  track: PropertyTrack | undefined,
  localTime: number,
  baseValue: number
): number {
  const dt = 0.05;
  const v1 = evaluatePropertyTrack(track, Math.max(0, localTime - dt), baseValue);
  const v2 = evaluatePropertyTrack(track, localTime + dt, baseValue);
  return (v2 - v1) / (dt * 2);
}

export function upsertKeyframeOnClip(
  clip: TimelineClip,
  prop: AnimatableProperty,
  time: number,
  value: number,
  easing: PropertyKeyframe['easing'] = 'bezier'
): PropertyTrack[] {
  const tracks = clip.keyframes ? [...clip.keyframes] : [];
  let trIdx = tracks.findIndex((t) => t.property === prop);
  const kf: PropertyKeyframe = {
    id: `pkf-${Math.random().toString(36).slice(2, 8)}`,
    time: Number(time.toFixed(3)),
    value: Number(value.toFixed(2)),
    easing,
  };

  if (trIdx === -1) {
    tracks.push({ property: prop, keyframes: [kf] });
  } else {
    const tr = tracks[trIdx];
    const existingIdx = tr.keyframes.findIndex((k) => Math.abs(k.time - time) < 0.02);
    const nextKeys =
      existingIdx >= 0
        ? tr.keyframes.map((k, i) => (i === existingIdx ? { ...k, value: kf.value } : k))
        : sortPropertyKeyframes([...tr.keyframes, kf]);
    tracks[trIdx] = { ...tr, keyframes: nextKeys };
  }
  return tracks;
}

export function deleteKeyframesFromTrack(
  clip: TimelineClip,
  prop: AnimatableProperty,
  keyIds: Set<string>
): PropertyTrack[] {
  if (!clip.keyframes) return [];
  return clip.keyframes
    .map((tr) =>
      tr.property === prop
        ? { ...tr, keyframes: tr.keyframes.filter((k) => !keyIds.has(k.id)) }
        : tr
    )
    .filter((tr) => tr.keyframes.length > 0 || tr.expression);
}

export function slicePropertyTracks(
  tracks: PropertyTrack[] | undefined,
  deltaStart: number,
  newDuration: number
): PropertyTrack[] | undefined {
  if (!tracks) return undefined;
  return tracks
    .map((tr) => ({
      ...tr,
      keyframes: tr.keyframes
        .map((k) => ({
          ...k,
          time: Number((k.time - deltaStart).toFixed(3)),
        }))
        .filter((k) => k.time >= 0 && k.time <= newDuration),
    }))
    .filter((tr) => tr.keyframes.length > 0 || tr.expression);
}
