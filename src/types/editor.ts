export type ExportQuality = '720p' | '1080p' | '2k' | '4k';

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MotionAnalysis {
  kind: 'point' | 'camera';
  samples: { time: number; x: number; y: number; confidence: number }[];
}

export type AspectRatioKey = '16:9' | '9:16' | '1:1' | '4:5' | '4k' | 'custom';

export interface AspectRatioSpec {
  label: string;
  width: number;
  height: number;
}

export const ASPECT_RATIOS: Record<AspectRatioKey, AspectRatioSpec> = {
  '16:9': { label: '16:9 Widescreen', width: 1920, height: 1080 },
  '9:16': { label: '9:16 Story / Reels', width: 1080, height: 1920 },
  '1:1': { label: '1:1 Quadrado', width: 1080, height: 1080 },
  '4:5': { label: '4:5 Retrato', width: 1080, height: 1350 },
  '4k': { label: '4K UHD Master', width: 3840, height: 2160 },
  'custom': { label: 'Personalizado', width: 1920, height: 1080 },
};

export type TrackType = 'video' | 'audio' | 'shape' | 'text' | '3d';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  muted?: boolean;
  hidden?: boolean;
  locked?: boolean;
  solo?: boolean;
}

export type ClipType =
  | 'video'
  | 'image'
  | 'audio'
  | 'shape'
  | 'text'
  | 'solid'
  | 'adjustment'
  | 'null'
  | 'model3d'
  | 'camera'
  | 'light'
  | 'lottie'
  | 'precomp'
  | 'svg';

export type TransitionType = 'none' | 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'blur-dissolve' | 'glitch';

export type MotionPreset = 'none' | 'zoom-in' | 'zoom-out' | 'pan-right' | 'pan-left';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'lighten'
  | 'darken'
  | 'difference'
  | 'exclusion'
  | 'luminosity';

export type TrackMatteMode = 'none' | 'alpha' | 'alpha-inverted' | 'luma' | 'luma-inverted';

export interface ColorAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  temperature: number;
  hue: number;
  blur: number;
  vignette: number;
  presetName: string;
}

export interface TextStyle {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeightMultiplier: number;
  pathArc: number;
  animation: TextAnimation;
  animator?: {
    enabled: boolean;
    unit: 'char' | 'word';
    rangeStart: number;
    rangeEnd: number;
    offsetX: number;
    offsetY: number;
    scale: number;
    rotation: number;
    opacity: number;
    tracking: number;
  };
}

export type TextAnimation =
  | 'none'
  | 'fade-up'
  | 'stagger-chars'
  | 'stagger-words'
  | 'tracking-in'
  | 'mask-reveal'
  | 'pop'
  | 'typewriter'
  | 'glow';

export type VectorShapeKind = 'rect' | 'ellipse' | 'polygon' | 'star' | 'line' | 'path';

export interface ShapeData {
  kind: VectorShapeKind;
  fillColor: string;
  gradientColor2: string;
  strokeColor: string;
  strokeWidth: number;
  fillMode: 'solid' | 'linear-gradient' | 'radial-gradient' | 'none';
  width: number;
  height: number;
  cornerRadius: number;
  pointsCount: number;
  innerRadiusRatio: number;
  trimStart: number;
  trimEnd: number;
  repeaterCopies: number;
  repeaterOffsetX: number;
  repeaterRotation: number;
}

export interface LayerMask {
  id: string;
  name: string;
  kind: 'rect' | 'ellipse' | 'star';
  enabled: boolean;
  mode: 'add' | 'subtract' | 'intersect';
  inverted: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  feather: number;
  expansion: number;
}

export interface PropertyKeyframe {
  id: string;
  time: number;
  value: number;
  easing: EasingName;
  outHandle?: { x: number; y: number };
  inHandle?: { x: number; y: number };
}

export type TrackLoopMode = 'none' | 'cycle' | 'pingpong' | 'offset';

export interface PropertyTrack {
  property: AnimatableProperty;
  keyframes: PropertyKeyframe[];
  loop?: TrackLoopMode;
  expression?: string;
  expressionEnabled?: boolean;
}

export type AnimatableProperty =
  | 'x'
  | 'y'
  | 'z'
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'rotation'
  | 'rotationX'
  | 'rotationY'
  | 'anchorX'
  | 'anchorY'
  | 'opacity'
  | 'strokeWidth'
  | 'trimStartPct'
  | 'trimEndPct'
  | 'maskFeather'
  | 'maskExpansion';

export type MotionBehaviorType = 'spring-in' | 'bounce' | 'wiggle' | 'inertia' | 'orbit';

export interface MotionBehavior {
  id: string;
  type: MotionBehaviorType;
  enabled: boolean;
  property: AnimatableProperty;
  intensity: number;
  damping: number;
  frequency: number;
  delay: number;
}

export interface ClipEffect {
  id: string;
  type: string;
  enabled: boolean;
  params: Record<string, number>;
  keyframes?: PropertyTrack[];
}

export interface TimeRemapKeyframe {
  id: string;
  time: number;
  sourceTime: number;
  interpolation: 'linear' | 'bezier' | 'hold';
  outHandle?: { x: number; y: number };
  inHandle?: { x: number; y: number };
}

export interface TimeRemap {
  enabled: boolean;
  sourceStart: number;
  sourceEnd: number;
  keyframes: TimeRemapKeyframe[];
}

export interface ClipVfx {
  background?: {
    enabled: boolean;
    tolerance: number;
    softness: number;
    color: string | null;
    connected: boolean;
  };
  cleanup?: {
    enabled: boolean;
    rect: { x: number; y: number; width: number; height: number };
    mode: 'clone' | 'blur' | 'pixelate';
    sourceOffsetX: number;
    sourceOffsetY: number;
    feather: number;
    followTrack: boolean;
    referenceTime?: number;
  };
  tracking?: {
    kind: 'point';
    samples: { time: number; x: number; y: number; confidence: number }[];
  };
  stabilization?: {
    enabled: boolean;
    strength: number;
    smoothing: number;
    crop: number;
    analysis?: { kind: 'camera'; samples: { time: number; x: number; y: number; confidence: number }[] };
  };
}

export interface TimelineClip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  startTime: number;
  duration: number;
  trimStart: number;
  maxDuration: number;
  mediaId?: string;
  thumbnail?: string;
  waveform?: number[];
  x: number;
  y: number;
  z?: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  unlinkScale?: boolean;
  rotation: number;
  rotationX?: number;
  rotationY?: number;
  anchorX?: number;
  anchorY?: number;
  opacity: number;
  flipH: boolean;
  flipV: boolean;
  fitMode: 'contain' | 'cover' | 'stretch';
  speed: number;
  motionPreset: MotionPreset;
  filters: ColorAdjustments;
  transitionIn: TransitionType;
  transitionInDuration: number;
  transitionOut: TransitionType;
  transitionOutDuration: number;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
  solidColor?: string;
  textStyle?: TextStyle;
  shapeData?: ShapeData;
  masks?: LayerMask[];
  effects?: ClipEffect[];
  keyframes?: PropertyTrack[];
  motionStack?: MotionBehavior[];
  timeRemap?: TimeRemap;
  vfx?: ClipVfx;
  enabled?: boolean;
  parentId?: string | null;
  blendMode?: BlendMode;
  trackMatte?: TrackMatteMode;
  is3D?: boolean;
  model3dData?: {
    geometry: 'cube' | 'sphere' | 'torus' | 'cylinder';
    color: string;
    roughness: number;
    metalness: number;
    wireframe: boolean;
    castShadow: boolean;
    receiveShadow: boolean;
  };
  cameraData?: {
    fov: number;
    near: number;
    far: number;
    focusDistance: number;
    aperture: number;
    lookAtX: number;
    lookAtY: number;
    lookAtZ: number;
  };
  lightData?: {
    lightType: 'directional' | 'point' | 'spot';
    color: string;
    intensity: number;
    distance: number;
    decay: number;
    castShadow: boolean;
  };
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface Composition {
  id: string;
  name: string;
  tracks: Track[];
  clips: TimelineClip[];
  markers: TimelineMarker[];
  width?: number;
  height?: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'svg' | 'lottie' | 'model3d';
  url: string;
  duration: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  waveform?: number[];
  envelope?: number[];
}

export interface PersistedAsset {
  id: string;
  name: string;
  type: MediaAsset['type'];
  duration: number;
  width?: number;
  height?: number;
}

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
export type StudioTheme = 'dark' | 'light';
export type PreviewResolution = 1 | 2 | 4;
export type LeftSidebarTab = 'media' | 'shapes' | 'text' | 'effects' | 'audio';

export interface WorkArea {
  start: number;
  end: number;
}

export interface ProjectState {
  projectName: string;
  aspectRatio: AspectRatioKey;
  customWidth?: number;
  customHeight?: number;
  fps: 24 | 30 | 60;
  backgroundColor: string;
  transparentBg: boolean;
  tracks: Track[];
  clips: TimelineClip[];
  markers: TimelineMarker[];
  compositions: Composition[];
  activeCompId: string;
  workArea?: WorkArea;
  customPresets?: SavedMotionPreset[];
  assetRegistry?: PersistedAsset[];
}

export interface SavedMotionPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  favorite: boolean;
  gradient: string;
  patch: {
    motionBehaviors?: Omit<MotionBehavior, 'id'>[];
    keyframes?: PropertyTrack[];
    effects?: { type: string; params: Record<string, number> }[];
    filters?: Partial<ColorAdjustments>;
    transitionIn?: TransitionType;
    transitionOut?: TransitionType;
    textAnimator?: TextStyle['animator'];
    shapePatch?: Partial<ShapeData>;
  };
}
