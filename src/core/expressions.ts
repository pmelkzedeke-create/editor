import { AnimatableProperty, MotionBehaviorType } from '../types/editor';

export interface MotionBehaviorDef {
  type: MotionBehaviorType;
  label: string;
  description: string;
  defaultProperty: AnimatableProperty;
  defaults: {
    intensity: number;
    damping: number;
    frequency: number;
    delay: number;
  };
}

export const MOTION_BEHAVIOR_DEFS: MotionBehaviorDef[] = [
  {
    type: 'spring-in',
    label: 'Spring In (Mola Elástica)',
    description: 'Entrada com overshoot elástico',
    defaultProperty: 'scale',
    defaults: { intensity: 45, damping: 4, frequency: 3, delay: 0 },
  },
  {
    type: 'bounce',
    label: 'Bounce (Queda com Quique)',
    description: 'Simula gravidade e impacto no solo',
    defaultProperty: 'y',
    defaults: { intensity: 60, damping: 6, frequency: 4, delay: 0 },
  },
  {
    type: 'wiggle',
    label: 'Wiggle (Tremores e Oscilação)',
    description: 'Flutuação orgânica contínua',
    defaultProperty: 'rotation',
    defaults: { intensity: 12, damping: 10, frequency: 5, delay: 0 },
  },
  {
    type: 'inertia',
    label: 'Inertia (Arrasto e Atraso)',
    description: 'Movimento com inércia ao parar',
    defaultProperty: 'x',
    defaults: { intensity: 30, damping: 8, frequency: 2, delay: 0.1 },
  },
];

export function validateSafeExpression(code: string): string | null {
  if (!code || code.trim().length === 0) return null;
  if (code.includes('eval') || code.includes('document') || code.includes('window')) {
    return 'Expressão contém termos restritos por segurança.';
  }
  return null;
}
