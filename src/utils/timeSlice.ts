export const TIME_SLICE_PRESET_COUNTS = [4, 8, 12, 16, 24, 32, 48, 64];

export const TIME_SLICE_DISTRIBUTIONS = [
  { id: 0, label: 'Linear Uniforme' },
  { id: 1, label: 'Exponencial (Rápido nas bordas)' },
  { id: 2, label: 'Senoidal (Smooth Wave)' },
  { id: 3, label: 'Gaussian (Concentrado no centro)' },
];

export const TIME_SLICE_INTERPOLATIONS = [
  { id: 0, label: 'Corte Seco (Hard)' },
  { id: 1, label: 'Smooth Crossfade' },
  { id: 2, label: 'Glow Border Blend' },
];

export const TIME_SLICE_MASK_TYPES = [
  { id: 0, label: 'Linhas Retas (Diagonais)' },
  { id: 1, label: 'Cones Radiais' },
  { id: 2, label: 'Ondas Senoidais' },
  { id: 3, label: 'Mosaic Hexagonal' },
];

export const DEFAULT_TIME_SLICE_PARAMS = {
  sliceNumber: 12,
  angle: 45,
  timeDistribution: 0,
  interpolation: 0,
  maskType: 0,
  phase: 0,
};

export const TIME_SLICE_PRESETS = [
  {
    id: 'ts-kinetic-wave',
    name: 'Kinetic Wave 24',
    description: '24 fatias em onda senoidal com crossfade',
    params: { sliceNumber: 24, angle: 30, timeDistribution: 2, interpolation: 1, maskType: 2, phase: 45 },
  },
  {
    id: 'ts-sharp-diag',
    name: 'Sharp Diagonal 16',
    description: '16 fatias diagonais de corte seco',
    params: { sliceNumber: 16, angle: 60, timeDistribution: 0, interpolation: 0, maskType: 0, phase: 0 },
  },
  {
    id: 'ts-radial-burst',
    name: 'Radial Burst 32',
    description: '32 fatias radiais estilo explosão',
    params: { sliceNumber: 32, angle: 0, timeDistribution: 1, interpolation: 2, maskType: 1, phase: 90 },
  },
];
