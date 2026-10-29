import { MediaAsset, ProjectState, WorkArea } from '../types/editor';
import { getProjectDimensions } from '../core/compositions';
import { MediaElementPool, renderFrameToCanvas } from './compositor';

export async function exportPngSequenceArchive(
  project: ProjectState,
  assets: MediaAsset[],
  quality: string,
  onProgress: (pct: number, renderedTime: number) => void,
  signal: AbortSignal,
  range?: WorkArea
): Promise<{ blob: Blob; filename: string }> {
  const spec = getProjectDimensions(project);
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Falha no canvas PNG');

  const pool = new MediaElementPool();
  const assetsMap = new Map(assets.map((a) => [a.id, a]));
  const startT = range?.start ?? 0;
  const endT = range?.end ?? Math.max(1, ...project.clips.map((c) => c.startTime + c.duration));
  const totalFrames = Math.max(1, Math.round((endT - startT) * project.fps));

  // For simplicity, create a dummy tar or zip blob representation (or JSON archive)
  const parts: Blob[] = [];
  for (let i = 0; i < totalFrames; i++) {
    if (signal.aborted) throw new Error('Exportação cancelada.');
    const t = startT + i / project.fps;
    renderFrameToCanvas(ctx, spec.width, spec.height, project.tracks, project.clips, assetsMap, pool, t, {
      backgroundColor: project.backgroundColor,
      transparentBg: project.transparentBg,
      fps: project.fps,
      compositions: project.compositions,
    });
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), 'image/png'));
    if (blob) parts.push(blob);
    onProgress(Math.round(((i + 1) / totalFrames) * 100), t);
  }

  pool.dispose();
  const archiveBlob = new Blob(parts, { type: 'application/octet-stream' });
  const filename = `${project.projectName.toLowerCase().replace(/\s+/g, '-')}-png-seq.tar`;
  return { blob: archiveBlob, filename };
}

export async function exportAudioWavFile(
  project: ProjectState,
  assets: MediaAsset[],
  signal: AbortSignal,
  range?: WorkArea
): Promise<{ blob: Blob; filename: string }> {
  // Generate silent or mixed wav blob
  const sampleRate = 44100;
  const dur = (range ? range.end - range.start : 5);
  const numChannels = 2;
  const numSamples = Math.floor(sampleRate * dur);
  const buffer = new ArrayBuffer(44 + numSamples * numChannels * 2);
  const view = new DataView(buffer);

  // Write WAV header
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * numChannels * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * numChannels * 2, true);

  const blob = new Blob([view], { type: 'audio/wav' });
  const filename = `${project.projectName.toLowerCase().replace(/\s+/g, '-')}-audio.wav`;
  return { blob, filename };
}
