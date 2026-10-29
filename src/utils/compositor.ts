import { Composition, ExportQuality, MediaAsset, TimelineClip, Track } from '../types/editor';
import { SourceEffectsProcessor } from '../core/vision/sourceEffects';
import { evaluatePropertyTrack } from '../core/keyframes';

export interface RenderedClipBounds {
  clipId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MediaElementPool {
  public sourceEffects = new SourceEffectsProcessor();
  private videos = new Map<string, HTMLVideoElement>();
  private images = new Map<string, HTMLImageElement>();
  private listeners = new Set<() => void>();

  constructor() {}

  getVideo(id: string, url: string): HTMLVideoElement {
    let v = this.videos.get(id);
    if (!v) {
      v = document.createElement('video');
      v.src = url;
      v.preload = 'auto';
      v.muted = true;
      v.playsInline = true;
      v.crossOrigin = 'anonymous';
      v.oncanplay = () => this.notify();
      this.videos.set(id, v);
    }
    return v;
  }

  getImage(url: string): HTMLImageElement {
    let img = this.images.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      img.crossOrigin = 'anonymous';
      img.onload = () => this.notify();
      this.images.set(url, img);
    }
    return img;
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    for (const cb of this.listeners) cb();
  }

  pauseAll() {
    for (const v of this.videos.values()) {
      v.pause();
    }
  }

  cleanupMissingClips(activeClipIds: Set<string>) {
    for (const [id, v] of this.videos.entries()) {
      if (!activeClipIds.has(id)) {
        v.pause();
        v.src = '';
        this.videos.delete(id);
      }
    }
  }

  dispose() {
    for (const v of this.videos.values()) {
      v.pause();
      v.src = '';
    }
    this.videos.clear();
    this.images.clear();
    this.listeners.clear();
  }
}

export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tracks: Track[],
  clips: TimelineClip[],
  assetsMap: Map<string, MediaAsset>,
  pool: MediaElementPool,
  currentTime: number,
  options: {
    backgroundColor: string;
    transparentBg: boolean;
    fps: number;
    compositions?: Composition[];
  }
): RenderedClipBounds[] {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background
  if (!options.transparentBg) {
    ctx.fillStyle = options.backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);
  }

  const bounds: RenderedClipBounds[] = [];
  const activeTracks = tracks.filter((t) => !t.hidden);

  for (const track of activeTracks) {
    const trackClips = clips.filter(
      (c) =>
        c.trackId === track.id &&
        c.enabled !== false &&
        currentTime >= c.startTime &&
        currentTime < c.startTime + c.duration
    );

    for (const clip of trackClips) {
      ctx.save();
      const localTime = Math.max(0, currentTime - clip.startTime);
      const progress = Math.min(1, Math.max(0, localTime / Math.max(0.01, clip.duration)));

      // 1. Evaluate animated properties via keyframes or base values
      const trackX = clip.keyframes?.find((k) => k.property === 'x');
      const trackY = clip.keyframes?.find((k) => k.property === 'y');
      const trackScale = clip.keyframes?.find((k) => k.property === 'scale');
      const trackRot = clip.keyframes?.find((k) => k.property === 'rotation');
      const trackOp = clip.keyframes?.find((k) => k.property === 'opacity');

      let posX = trackX ? evaluatePropertyTrack(trackX, localTime, clip.x) : clip.x;
      let posY = trackY ? evaluatePropertyTrack(trackY, localTime, clip.y) : clip.y;
      let scale = trackScale ? evaluatePropertyTrack(trackScale, localTime, clip.scale) : clip.scale;
      let rotation = trackRot ? evaluatePropertyTrack(trackRot, localTime, clip.rotation) : clip.rotation;
      let opacity = trackOp ? evaluatePropertyTrack(trackOp, localTime, clip.opacity) : clip.opacity;

      // 2. Motion Presets (camera zoom/pan)
      if (clip.motionPreset === 'zoom-in') {
        scale *= 1 + progress * 0.15;
      } else if (clip.motionPreset === 'zoom-out') {
        scale *= 1.15 - progress * 0.15;
      } else if (clip.motionPreset === 'pan-right') {
        posX += (progress - 0.5) * 8;
      } else if (clip.motionPreset === 'pan-left') {
        posX -= (progress - 0.5) * 8;
      }

      // 3. Transitions In / Out
      let transitionAlpha = 1;
      let transitionScaleOffset = 1;
      let transitionOffsetX = 0;

      if (clip.transitionIn !== 'none' && clip.transitionInDuration > 0 && localTime < clip.transitionInDuration) {
        const inPct = localTime / clip.transitionInDuration;
        if (clip.transitionIn === 'fade' || clip.transitionIn === 'blur-dissolve') {
          transitionAlpha *= inPct;
        } else if (clip.transitionIn === 'zoom-in') {
          transitionAlpha *= inPct;
          transitionScaleOffset = 0.75 + inPct * 0.25;
        } else if (clip.transitionIn === 'slide-left') {
          transitionOffsetX = (1 - inPct) * (width * 0.4);
        }
      }

      const timeRemaining = clip.duration - localTime;
      if (clip.transitionOut !== 'none' && clip.transitionOutDuration > 0 && timeRemaining < clip.transitionOutDuration) {
        const outPct = timeRemaining / clip.transitionOutDuration;
        if (clip.transitionOut === 'fade' || clip.transitionOut === 'blur-dissolve') {
          transitionAlpha *= outPct;
        } else if (clip.transitionOut === 'zoom-in') {
          transitionAlpha *= outPct;
          transitionScaleOffset = 1 + (1 - outPct) * 0.25;
        } else if (clip.transitionOut === 'slide-right') {
          transitionOffsetX = (1 - outPct) * (width * 0.4);
        }
      }

      // 4. Calculate Center Origin & Transforms
      const cx = width / 2 + ((posX + (clip.anchorX || 0)) / 100) * width + transitionOffsetX;
      const cy = height / 2 + ((posY + (clip.anchorY || 0)) / 100) * height;

      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);

      const effectiveScale = (scale / 100) * transitionScaleOffset;
      const baseScaleMult = width / 1920;
      ctx.scale(
        effectiveScale * baseScaleMult * (clip.flipH ? -1 : 1),
        effectiveScale * baseScaleMult * (clip.flipV ? -1 : 1)
      );

      ctx.globalAlpha = Math.max(0, Math.min(1, (opacity / 100) * transitionAlpha));

      // 5. Blend Mode
      if (clip.blendMode && clip.blendMode !== 'source-over') {
        ctx.globalCompositeOperation = clip.blendMode;
      }

      // 6. Color Filters
      const f = clip.filters;
      if (f) {
        const filterParts: string[] = [];
        if (f.brightness !== 100) filterParts.push(`brightness(${f.brightness}%)`);
        if (f.contrast !== 100) filterParts.push(`contrast(${f.contrast}%)`);
        if (f.saturation !== 100) filterParts.push(`saturate(${f.saturation}%)`);
        if (f.hue !== 0) filterParts.push(`hue-rotate(${f.hue}deg)`);
        if (f.blur > 0) filterParts.push(`blur(${f.blur}px)`);
        if (filterParts.length > 0) {
          ctx.filter = filterParts.join(' ');
        }
      }

      // 7. Render Layer Content by Type
      if (clip.type === 'solid') {
        const solidW = width * 1.2;
        const solidH = height * 1.2;
        ctx.fillStyle = clip.solidColor || '#2563eb';
        ctx.fillRect(-solidW / 2, -solidH / 2, solidW, solidH);
        bounds.push({
          clipId: clip.id,
          x: cx - solidW / 2,
          y: cy - solidH / 2,
          width: solidW,
          height: solidH,
        });
      } else if (clip.type === 'shape' && clip.shapeData) {
        const sd = clip.shapeData;
        const shapeW = (sd.width / 100) * width;
        const shapeH = (sd.height / 100) * height;

        ctx.lineWidth = sd.strokeWidth || 2;
        ctx.strokeStyle = sd.strokeColor || '#ffffff';

        if (sd.fillMode === 'linear-gradient') {
          const grad = ctx.createLinearGradient(-shapeW / 2, -shapeH / 2, shapeW / 2, shapeH / 2);
          grad.addColorStop(0, sd.fillColor || '#3b82f6');
          grad.addColorStop(1, sd.gradientColor2 || '#8b5cf6');
          ctx.fillStyle = grad;
        } else if (sd.fillMode === 'radial-gradient') {
          const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, shapeW / 2);
          grad.addColorStop(0, sd.fillColor || '#3b82f6');
          grad.addColorStop(1, sd.gradientColor2 || '#8b5cf6');
          ctx.fillStyle = grad;
        } else if (sd.fillMode !== 'none') {
          ctx.fillStyle = sd.fillColor || '#3b82f6';
        }

        ctx.beginPath();
        if (sd.kind === 'rect') {
          const cr = sd.cornerRadius || 0;
          if (ctx.roundRect) {
            ctx.roundRect(-shapeW / 2, -shapeH / 2, shapeW, shapeH, cr);
          } else {
            ctx.rect(-shapeW / 2, -shapeH / 2, shapeW, shapeH);
          }
        } else if (sd.kind === 'ellipse') {
          ctx.ellipse(0, 0, shapeW / 2, shapeH / 2, 0, 0, Math.PI * 2);
        } else if (sd.kind === 'polygon') {
          const pts = sd.pointsCount || 6;
          const r = shapeW / 2;
          for (let i = 0; i < pts; i++) {
            const a = (i * 2 * Math.PI) / pts - Math.PI / 2;
            const px = r * Math.cos(a);
            const py = r * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        } else if (sd.kind === 'star') {
          const pts = (sd.pointsCount || 5) * 2;
          const rOuter = shapeW / 2;
          const rInner = rOuter * (sd.innerRadiusRatio || 0.45);
          for (let i = 0; i < pts; i++) {
            const r = i % 2 === 0 ? rOuter : rInner;
            const a = (i * Math.PI) / (pts / 2) - Math.PI / 2;
            const px = r * Math.cos(a);
            const py = r * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
        } else if (sd.kind === 'line') {
          ctx.moveTo(-shapeW / 2, 0);
          ctx.lineTo(shapeW / 2, 0);
        } else {
          // Curved Bézier path
          ctx.moveTo(-shapeW / 2, shapeH / 4);
          ctx.bezierCurveTo(-shapeW / 4, -shapeH / 2, shapeW / 4, shapeH / 2, shapeW / 2, -shapeH / 4);
        }

        if (sd.fillMode !== 'none' && sd.kind !== 'line') {
          ctx.fill();
        }
        if (sd.strokeWidth > 0) {
          ctx.stroke();
        }

        bounds.push({
          clipId: clip.id,
          x: cx - shapeW / 2,
          y: cy - shapeH / 2,
          width: shapeW,
          height: shapeH,
        });
      } else if (clip.type === 'text' && clip.textStyle) {
        const ts = clip.textStyle;
        let animatedText = ts.text;
        let textScale = 1;
        let textOffsetY = 0;
        let textAlpha = 1;

        // Kinetic text animation logic
        if (ts.animation === 'typewriter') {
          const revealChars = Math.floor(Math.min(1, localTime / 1.5) * ts.text.length);
          animatedText = ts.text.slice(0, revealChars);
        } else if (ts.animation === 'fade-up') {
          const enterDuration = 0.5;
          if (localTime < enterDuration) {
            const t = localTime / enterDuration;
            textAlpha = t;
            textOffsetY = (1 - t) * 24;
          }
        } else if (ts.animation === 'pop') {
          const enterDuration = 0.45;
          if (localTime < enterDuration) {
            const t = localTime / enterDuration;
            textScale = Math.sin(t * Math.PI * 0.75) * 1.25;
          }
        } else if (ts.animation === 'glow') {
          const pulse = (Math.sin(currentTime * 4) + 1) / 2;
          ctx.shadowColor = ts.color || '#38bdf8';
          ctx.shadowBlur = 10 + pulse * 25;
        }

        ctx.font = `${ts.fontWeight} ${ts.fontSize * textScale}px ${ts.fontFamily}, sans-serif`;
        ctx.fillStyle = ts.color;
        ctx.textAlign = ts.textAlign;
        ctx.textBaseline = 'middle';
        ctx.globalAlpha *= textAlpha;

        const lines = animatedText.split('\n');
        const lineHeight = ts.fontSize * (ts.lineHeightMultiplier || 1.2) * textScale;

        lines.forEach((line, idx) => {
          const lineY = (idx - (lines.length - 1) / 2) * lineHeight + textOffsetY;

          if (ts.backgroundColor && ts.backgroundColor !== '#00000000') {
            const m = ctx.measureText(line);
            ctx.fillStyle = ts.backgroundColor;
            ctx.fillRect(-m.width / 2 - 8, lineY - lineHeight / 2 + 4, m.width + 16, lineHeight);
            ctx.fillStyle = ts.color;
          }

          if (ts.letterSpacing && ts.letterSpacing !== 0 && (ctx as any).letterSpacing !== undefined) {
            (ctx as any).letterSpacing = `${ts.letterSpacing}px`;
          }

          ctx.fillText(line, 0, lineY);

          if (ts.strokeWidth > 0) {
            ctx.strokeStyle = ts.strokeColor;
            ctx.lineWidth = ts.strokeWidth;
            ctx.strokeText(line, 0, lineY);
          }
        });

        bounds.push({
          clipId: clip.id,
          x: cx - 180,
          y: cy - 40,
          width: 360,
          height: 80,
        });
      } else {
        // Video or Image Asset
        const asset = clip.mediaId ? assetsMap.get(clip.mediaId) : undefined;
        if (asset) {
          const dw = width;
          const dh = height;

          if (asset.type === 'image' || asset.type === 'svg') {
            const img = pool.getImage(asset.url);
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
              bounds.push({
                clipId: clip.id,
                x: cx - dw / 2,
                y: cy - dh / 2,
                width: dw,
                height: dh,
              });
            }
          } else if (asset.type === 'video') {
            const v = pool.getVideo(clip.id, asset.url);
            if (v.readyState >= 2) {
              ctx.drawImage(v, -dw / 2, -dh / 2, dw, dh);
              bounds.push({
                clipId: clip.id,
                x: cx - dw / 2,
                y: cy - dh / 2,
                width: dw,
                height: dh,
              });
            }
          }
        }
      }

      ctx.restore();
    }
  }

  // Vignette overlay
  const hasVignetteClip = clips.find((c) => c.filters?.vignette > 0 && currentTime >= c.startTime && currentTime < c.startTime + c.duration);
  if (hasVignetteClip && hasVignetteClip.filters.vignette > 0) {
    const vigAmt = hasVignetteClip.filters.vignette / 100;
    const radial = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.25,
      width / 2,
      height / 2,
      width * 0.65
    );
    radial.addColorStop(0, 'rgba(0,0,0,0)');
    radial.addColorStop(1, `rgba(0,0,0,${vigAmt * 0.85})`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
  return bounds;
}

export function syncMediaPlayback(
  pool: MediaElementPool,
  tracks: Track[],
  clips: TimelineClip[],
  assetsMap: Map<string, MediaAsset>,
  currentTime: number,
  isPlaying: boolean,
  isCached: boolean
) {
  const activeTracks = tracks.filter((t) => !t.hidden && !t.muted);

  for (const track of activeTracks) {
    const trackClips = clips.filter(
      (c) =>
        c.trackId === track.id &&
        c.enabled !== false &&
        currentTime >= c.startTime &&
        currentTime < c.startTime + c.duration
    );

    for (const clip of trackClips) {
      if (clip.type === 'video' && clip.mediaId) {
        const asset = assetsMap.get(clip.mediaId);
        if (asset && asset.type === 'video') {
          const v = pool.getVideo(clip.id, asset.url);
          const targetTime = clip.trimStart + (currentTime - clip.startTime) * (clip.speed || 1);
          if (Math.abs(v.currentTime - targetTime) > 0.2) {
            v.currentTime = targetTime;
          }
          if (isPlaying && v.paused) {
            v.play().catch(() => {});
          } else if (!isPlaying && !v.paused) {
            v.pause();
          }
        }
      }
    }
  }
}

export async function exportProjectToVideoFile(
  project: ProjectState,
  assets: MediaAsset[],
  quality: ExportQuality,
  onProgress: (pct: number, renderedTime: number) => void,
  signal: AbortSignal,
  options?: { range?: { start: number; end: number }; bitrateMbps?: number }
): Promise<{ blob: Blob; filename: string }> {
  const spec = { width: 1920, height: 1080 };
  if (quality === '720p') { spec.width = 1280; spec.height = 720; }
  else if (quality === '2k') { spec.width = 2560; spec.height = 1440; }
  else if (quality === '4k') { spec.width = 3840; spec.height = 2160; }

  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Falha ao inicializar contexto de canvas para exportação.');

  const pool = new MediaElementPool();
  const assetsMap = new Map(assets.map((a) => [a.id, a]));
  const startT = options?.range?.start ?? 0;
  const endT = options?.range?.end ?? Math.max(1, ...project.clips.map((c) => c.startTime + c.duration));
  const totalFrames = Math.max(1, Math.round((endT - startT) * project.fps));

  const chunks: Blob[] = [];
  const stream = canvas.captureStream(project.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm',
    videoBitsPerSecond: (options?.bitrateMbps ?? 8) * 1_000_000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  for (let i = 0; i < totalFrames; i++) {
    if (signal.aborted) {
      recorder.stop();
      pool.dispose();
      throw new Error('Exportação cancelada.');
    }
    const t = startT + i / project.fps;
    renderFrameToCanvas(
      ctx,
      spec.width,
      spec.height,
      project.tracks,
      project.clips,
      assetsMap,
      pool,
      t,
      {
        backgroundColor: project.backgroundColor,
        transparentBg: project.transparentBg,
        fps: project.fps,
        compositions: project.compositions,
      }
    );
    onProgress(Math.round(((i + 1) / totalFrames) * 100), t);
    await new Promise((r) => setTimeout(r, 8));
  }

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });

  pool.dispose();
  const blob = new Blob(chunks, { type: 'video/webm' });
  const filename = `${project.projectName.toLowerCase().replace(/\s+/g, '-')}-master.webm`;
  return { blob, filename };
}
