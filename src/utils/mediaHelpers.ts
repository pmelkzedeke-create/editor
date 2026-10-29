import { ColorAdjustments, MediaAsset, TimelineClip, TrackType, TextStyle, TransitionType } from '../types/editor';

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const DEFAULT_FILTERS: ColorAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  hue: 0,
  blur: 0,
  vignette: 0,
  presetName: 'Normal',
};

export const COLOR_PRESETS: { id: string; name: string; badge: string; gradient: string; filters: ColorAdjustments }[] = [
  { id: 'norm', name: 'Normal', badge: 'STD', gradient: 'from-gray-500 to-gray-700', filters: { ...DEFAULT_FILTERS } },
  { id: 'cinematic', name: 'Teal & Orange', badge: 'CIN', gradient: 'from-cyan-600 to-amber-600', filters: { brightness: 105, contrast: 125, saturation: 115, temperature: 25, hue: -10, blur: 0, vignette: 35, presetName: 'Teal & Orange' } },
  { id: 'noir', name: 'Noir Monocromático', badge: 'BW', gradient: 'from-gray-800 to-black', filters: { brightness: 95, contrast: 145, saturation: 0, temperature: 0, hue: 0, blur: 0, vignette: 50, presetName: 'Noir' } },
  { id: 'cyber', name: 'Cyberpunk Neon', badge: 'CYB', gradient: 'from-fuchsia-600 to-cyan-500', filters: { brightness: 110, contrast: 135, saturation: 160, temperature: -30, hue: 15, blur: 0, vignette: 40, presetName: 'Cyberpunk' } },
];

export const TRANSITION_OPTIONS: { id: TransitionType; label: string; desc: string }[] = [
  { id: 'none', label: 'Nenhuma', desc: 'Corte seco' },
  { id: 'fade', label: 'Fade / Dissolve', desc: 'Suaviza a entrada/saída com opacidade' },
  { id: 'slide-left', label: 'Deslizar para Esquerda', desc: 'Desliza a camada horizontalmente' },
  { id: 'zoom-in', label: 'Zoom In Dinâmico', desc: 'Aproxima com escala fluida' },
  { id: 'blur-dissolve', label: 'Dissolução com Blur', desc: 'Desfoque gaussiano progressivo' },
  { id: 'glitch', label: 'Glitch Digital', desc: 'Interferência digital e RGB split' },
];

export interface TextPresetItem {
  id: string;
  label: string;
  subtitle: string;
  previewText: string;
  y: number;
  style: TextStyle;
}

export const TEXT_PRESETS: TextPresetItem[] = [
  {
    id: 'title-bold',
    label: 'Título Impactante',
    subtitle: 'Fonte pesada centrada',
    previewText: 'TÍTULO PRINCIPAL',
    y: 0,
    style: {
      text: 'NOVO PROJETO',
      fontFamily: 'Inter',
      fontSize: 56,
      fontWeight: '800',
      color: '#ffffff',
      backgroundColor: '#00000000',
      strokeColor: '#000000',
      strokeWidth: 3,
      textAlign: 'center',
      letterSpacing: 3,
      lineHeightMultiplier: 1.2,
      pathArc: 0,
      animation: 'fade-up',
    },
  },
  {
    id: 'lower-third',
    label: 'Lower Third Minimal',
    subtitle: 'Identificação inferior',
    previewText: 'Nome do Apresentador',
    y: 35,
    style: {
      text: 'NOME DO APRESENTADOR\nCargo / Especialidade',
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: '600',
      color: '#ffffff',
      backgroundColor: '#18181ce6',
      strokeColor: '#3b82f6',
      strokeWidth: 0,
      textAlign: 'left',
      letterSpacing: 1,
      lineHeightMultiplier: 1.3,
      pathArc: 0,
      animation: 'stagger-words',
    },
  },
  {
    id: 'neon-glow',
    label: 'Neon Cyber Glow',
    subtitle: 'Título com brilho',
    previewText: 'CYBERPUNK',
    y: -10,
    style: {
      text: 'CYBERPUNK 2077',
      fontFamily: 'Impact',
      fontSize: 64,
      fontWeight: '400',
      color: '#38bdf8',
      backgroundColor: '#00000000',
      strokeColor: '#f43f5e',
      strokeWidth: 2,
      textAlign: 'center',
      letterSpacing: 4,
      lineHeightMultiplier: 1.1,
      pathArc: 0,
      animation: 'glow',
    },
  },
];

export function formatTimecode(seconds: number, showFrames = true, fps = 30): string {
  const abs = Math.max(0, seconds);
  const m = Math.floor(abs / 60);
  const s = Math.floor(abs % 60);
  const f = Math.floor((abs % 1) * fps);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  const ff = String(f).padStart(2, '0');
  return showFrames ? `${mm}:${ss}:${ff}` : `${mm}:${ss}`;
}

export async function parseUploadedMediaFile(
  file: File,
  options?: { signal?: AbortSignal; onProgress?: (p: { stage: string; percent: number }) => void }
): Promise<MediaAsset | null> {
  const url = URL.createObjectURL(file);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (options?.onProgress) {
    options.onProgress({ stage: 'Lendo metadados...', percent: 15 });
  }

  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => {
        if (options?.signal?.aborted) {
          resolve(null);
          return;
        }
        if (options?.onProgress) {
          options.onProgress({ stage: 'Gerando prévia...', percent: 60 });
        }
        resolve({
          id: uid('asset'),
          name: file.name,
          type: 'video',
          url,
          duration: Math.max(1, video.duration || 5),
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          thumbnail: url,
        });
      };
      video.onerror = () => resolve(null);
    });
  }

  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        resolve({
          id: uid('asset'),
          name: file.name,
          type: 'image',
          url,
          duration: 10,
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1080,
          thumbnail: url,
        });
      };
      img.onerror = () => resolve(null);
    });
  }

  if (['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'].includes(ext)) {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.src = url;
      audio.onloadedmetadata = () => {
        resolve({
          id: uid('asset'),
          name: file.name,
          type: 'audio',
          url,
          duration: Math.max(2, audio.duration || 10),
          waveform: Array.from({ length: 48 }, () => Math.random() * 0.8 + 0.2),
        });
      };
      audio.onerror = () => resolve(null);
    });
  }

  if (['glb', 'gltf'].includes(ext)) {
    return {
      id: uid('asset'),
      name: file.name,
      type: 'model3d',
      url,
      duration: 10,
    };
  }

  if (ext === 'svg' || ext === 'json') {
    return {
      id: uid('asset'),
      name: file.name,
      type: ext === 'json' ? 'lottie' : 'svg',
      url,
      duration: 10,
      width: 1920,
      height: 1080,
    };
  }

  return null;
}

export function createClipFromAsset(
  asset: MediaAsset,
  trackId: string,
  startTime: number
): TimelineClip {
  return {
    id: uid('clip'),
    trackId,
    type: asset.type === 'audio' ? 'audio' : asset.type === 'model3d' ? 'model3d' : asset.type === 'image' ? 'image' : 'video',
    name: asset.name,
    startTime: Number(startTime.toFixed(2)),
    duration: Math.min(asset.duration, 10),
    trimStart: 0,
    maxDuration: asset.duration,
    mediaId: asset.id,
    thumbnail: asset.thumbnail,
    waveform: asset.waveform,
    x: 0,
    y: 0,
    scale: 100,
    rotation: 0,
    opacity: 100,
    flipH: false,
    flipV: false,
    fitMode: 'cover',
    speed: 1,
    motionPreset: 'none',
    filters: { ...DEFAULT_FILTERS },
    transitionIn: 'fade',
    transitionInDuration: 0.25,
    transitionOut: 'fade',
    transitionOutDuration: 0.25,
    volume: asset.type === 'audio' || asset.type === 'video' ? 100 : 0,
    muted: false,
    fadeIn: 0,
    fadeOut: 0,
  };
}
