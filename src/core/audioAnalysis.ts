import { TimelineMarker } from '../types/editor';
import { uid } from '../utils/mediaHelpers';

export async function decodeAudioAssetEnvelope(url: string): Promise<number[]> {
  return Array.from({ length: 120 }, () => Math.random() * 0.9 + 0.1);
}

export function buildBeatMarkersForClip(
  startT: number,
  dur: number,
  trim: number,
  spd: number,
  envelope: number[]
): TimelineMarker[] {
  const markers: TimelineMarker[] = [];
  const step = Math.max(0.5, dur / 8);
  for (let t = startT; t < startT + dur; t += step) {
    markers.push({
      id: uid('beat'),
      time: Number(t.toFixed(2)),
      label: 'Beat',
      color: '#10b981',
    });
  }
  return markers;
}
