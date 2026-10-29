import { SavedMotionPreset } from '../types/editor';

export const BUILTIN_MOTION_PRESETS: SavedMotionPreset[] = [
  {
    id: 'preset-pop-scale',
    name: 'Pop Scale In',
    category: 'Intro',
    description: 'Aproximação elástica e dinâmica',
    version: '1.0',
    favorite: true,
    gradient: 'from-blue-500 to-indigo-600',
    patch: {
      motionBehaviors: [{ type: 'spring-in', enabled: true, property: 'scale', intensity: 50, damping: 4, frequency: 3, delay: 0 }],
      transitionIn: 'zoom-in',
      transitionOut: 'fade',
    },
  },
  {
    id: 'preset-float',
    name: 'Float Wiggle',
    category: 'Ambient',
    description: 'Flutuação suave contínua',
    version: '1.0',
    favorite: true,
    gradient: 'from-emerald-500 to-teal-600',
    patch: {
      motionBehaviors: [{ type: 'wiggle', enabled: true, property: 'y', intensity: 8, damping: 10, frequency: 2, delay: 0 }],
    },
  },
];
