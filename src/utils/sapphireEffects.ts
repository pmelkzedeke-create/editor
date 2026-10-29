import { ClipEffect } from '../types/editor';
import { uid } from './mediaHelpers';

export interface EffectParamDef {
  key: string;
  label: string;
  def: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface EffectDefinition {
  type: string;
  label: string;
  category: string;
  description: string;
  gradient: string;
  params: EffectParamDef[];
}

export interface EffectPreset {
  id: string;
  label: string;
  description: string;
  effects: { type: string; params: Record<string, number> }[];
}

export const EFFECT_CATEGORIES = [
  'Iluminação & Glow',
  'Estilização & Filme',
  'Distorção & Glitch',
  'Tempo & Movimento',
  'Ferramental & Util',
];

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  {
    type: 'S_Glow',
    label: 'Sapphire Glow',
    category: 'Iluminação & Glow',
    description: 'Brilho cinematográfico radiante nas altas luzes',
    gradient: 'from-amber-500 to-yellow-300',
    params: [
      { key: 'brightness', label: 'Intensidade', def: 1.5, min: 0.1, max: 5.0, step: 0.1 },
      { key: 'radius', label: 'Raio do Blur', def: 32, min: 2, max: 120, step: 1, unit: 'px' },
      { key: 'threshold', label: 'Limiar (Threshold)', def: 0.75, min: 0.0, max: 1.0, step: 0.05 },
    ],
  },
  {
    type: 'S_EdgeDetect',
    label: 'Edge Detect (Neon)',
    category: 'Estilização & Filme',
    description: 'Extrai bordas e contornos estilo neon sci-fi',
    gradient: 'from-cyan-500 to-blue-600',
    params: [
      { key: 'strength', label: 'Intensidade', def: 1.2, min: 0.1, max: 3.0, step: 0.1 },
      { key: 'threshold', label: 'Limiar', def: 0.2, min: 0.0, max: 1.0, step: 0.05 },
    ],
  },
  {
    type: 'S_Glitch',
    label: 'Digital Glitch',
    category: 'Distorção & Glitch',
    description: 'Interferência digital RGB split e ruído digital',
    gradient: 'from-rose-600 to-purple-600',
    params: [
      { key: 'amount', label: 'Intensidade', def: 0.35, min: 0.0, max: 1.0, step: 0.05 },
      { key: 'rgbSplit', label: 'Separação RGB', def: 12, min: 0, max: 50, step: 1, unit: 'px' },
    ],
  },
  {
    type: 'S_Blur',
    label: 'Gaussian Blur',
    category: 'Estilização & Filme',
    description: 'Desfoque gaussiano suave de estúdio',
    gradient: 'from-emerald-500 to-teal-700',
    params: [
      { key: 'radius', label: 'Raio', def: 16, min: 0, max: 100, step: 1, unit: 'px' },
    ],
  },
  {
    type: 'S_TimeSlice',
    label: 'Time Slice Pro',
    category: 'Tempo & Movimento',
    description: 'Efeito de fatiamento temporal com máscaras e gradientes',
    gradient: 'from-purple-500 to-indigo-600',
    params: [
      { key: 'sliceNumber', label: 'Número de Fatias', def: 12, min: 2, max: 64, step: 1 },
      { key: 'angle', label: 'Ângulo', def: 45, min: -180, max: 180, step: 1, unit: '°' },
      { key: 'timeDistribution', label: 'Distribuição', def: 0, min: 0, max: 3, step: 1 },
      { key: 'interpolation', label: 'Interpolação', def: 0, min: 0, max: 2, step: 1 },
      { key: 'maskType', label: 'Tipo de Máscara', def: 0, min: 0, max: 3, step: 1 },
      { key: 'phase', label: 'Fase Temporal', def: 0, min: 0, max: 360, step: 1, unit: '°' },
    ],
  },
];

export const EFFECTS_BY_TYPE = new Map(EFFECT_DEFINITIONS.map((e) => [e.type, e]));

export const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: 'preset-dreamy',
    label: 'Dreamy Glow',
    description: 'Glow suave com desfoque cinematográfico',
    effects: [
      { type: 'S_Glow', params: { brightness: 2.2, radius: 48, threshold: 0.6 } },
      { type: 'S_Blur', params: { radius: 4 } },
    ],
  },
  {
    id: 'preset-cyberpunk',
    label: 'Cyber Glitch',
    description: 'Glitch intenso com divisão RGB',
    effects: [
      { type: 'S_Glitch', params: { amount: 0.6, rgbSplit: 24 } },
      { type: 'S_EdgeDetect', params: { strength: 1.5, threshold: 0.15 } },
    ],
  },
];

export function createEffect(type: string, customParams?: Record<string, number>): ClipEffect | null {
  const def = EFFECTS_BY_TYPE.get(type);
  if (!def) return null;
  const params: Record<string, number> = {};
  for (const p of def.params) {
    params[p.key] = customParams?.[p.key] ?? p.def;
  }
  return {
    id: uid('fx'),
    type,
    enabled: true,
    params,
    keyframes: [],
  };
}
