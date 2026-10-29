import { LayerMask, ShapeData, VectorShapeKind } from '../types/editor';
import { uid } from '../utils/mediaHelpers';

export function createDefaultShapeData(kind: VectorShapeKind): ShapeData {
  return {
    kind,
    fillColor: '#3b82f6',
    gradientColor2: '#8b5cf6',
    strokeColor: '#ffffff',
    strokeWidth: 2,
    fillMode: 'solid',
    width: 40,
    height: 40,
    cornerRadius: kind === 'rect' ? 8 : 0,
    pointsCount: kind === 'polygon' ? 6 : kind === 'star' ? 5 : 4,
    innerRadiusRatio: 0.5,
    trimStart: 0,
    trimEnd: 100,
    repeaterCopies: 1,
    repeaterOffsetX: 30,
    repeaterRotation: 0,
  };
}

export function createDefaultMask(kind: 'rect' | 'ellipse' | 'star', index = 1): LayerMask {
  return {
    id: uid('mask'),
    name: `Máscara ${index} (${kind === 'rect' ? 'Retangular' : kind === 'ellipse' ? 'Elíptica' : 'Estrela'})`,
    kind,
    enabled: true,
    mode: 'add',
    inverted: false,
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    feather: 10,
    expansion: 0,
  };
}
