import { Composition, ProjectState } from '../types/editor';
import { uid } from '../utils/mediaHelpers';

export function getProjectDimensions(project: ProjectState) {
  if (project.aspectRatio === '9:16') return { label: '9:16 Story', width: 1080, height: 1920 };
  if (project.aspectRatio === '1:1') return { label: '1:1 Square', width: 1080, height: 1080 };
  if (project.aspectRatio === '4:5') return { label: '4:5 Portrait', width: 1080, height: 1350 };
  if (project.aspectRatio === '4k') return { label: '4K UHD', width: 3840, height: 2160 };
  if (project.aspectRatio === 'custom') return { label: 'Custom', width: project.customWidth || 1920, height: project.customHeight || 1080 };
  return { label: '16:9 Widescreen', width: 1920, height: 1080 };
}

export function syncActiveComposition(project: ProjectState): ProjectState {
  if (!project.compositions || project.compositions.length === 0) {
    const comp: Composition = {
      id: 'comp-main',
      name: 'Composição Principal',
      tracks: project.tracks,
      clips: project.clips,
      markers: project.markers,
    };
    return {
      ...project,
      compositions: [comp],
      activeCompId: 'comp-main',
    };
  }
  // Propaga as alterações do topo (tracks/clips/markers) para a composição ativa
  // Em vez de sobrescrever o topo com dados antigos da composição (bug que impedia novo projeto e adicionar clips)
  const activeExists = project.compositions.some((c) => c.id === project.activeCompId);
  if (!activeExists) {
    // Fallback: se activeCompId inválido, restaura do primeiro mas mantém estrutura
    const first = project.compositions[0];
    return {
      ...project,
      tracks: first.tracks,
      clips: first.clips,
      markers: first.markers,
    };
  }
  const updatedCompositions = project.compositions.map((c) =>
    c.id === project.activeCompId
      ? { ...c, tracks: project.tracks, clips: project.clips, markers: project.markers }
      : c
  );
  return {
    ...project,
    compositions: updatedCompositions,
  };
}

export function switchActiveComposition(project: ProjectState, compId: string): ProjectState {
  const currentSaved = project.compositions.map((c) =>
    c.id === project.activeCompId
      ? { ...c, tracks: project.tracks, clips: project.clips, markers: project.markers }
      : c
  );
  const target = currentSaved.find((c) => c.id === compId);
  if (!target) return project;
  return {
    ...project,
    compositions: currentSaved,
    activeCompId: compId,
    tracks: target.tracks,
    clips: target.clips,
    markers: target.markers,
  };
}

export function createNewComposition(project: ProjectState): ProjectState {
  const currentSaved = project.compositions.map((c) =>
    c.id === project.activeCompId
      ? { ...c, tracks: project.tracks, clips: project.clips, markers: project.markers }
      : c
  );
  const newCompId = uid('comp');
  const newComp: Composition = {
    id: newCompId,
    name: `Composição ${currentSaved.length + 1}`,
    tracks: [
      { id: uid('track'), name: 'V1 • Principal', type: 'video' },
      { id: uid('track'), name: 'A1 • Áudio', type: 'audio' },
    ],
    clips: [],
    markers: [],
  };
  return {
    ...project,
    compositions: [...currentSaved, newComp],
    activeCompId: newCompId,
    tracks: newComp.tracks,
    clips: newComp.clips,
    markers: newComp.markers,
  };
}

export function precomposeClips(project: ProjectState, clipIds: string[]) {
  const selected = project.clips.filter((c) => clipIds.includes(c.id));
  if (selected.length === 0) return null;

  const minStart = Math.min(...selected.map((c) => c.startTime));
  const maxEnd = Math.max(...selected.map((c) => c.startTime + c.duration));
  const precompDuration = maxEnd - minStart;

  const precompClipId = uid('clip-precomp');
  const precompCompId = uid('comp');

  const precompComposition: Composition = {
    id: precompCompId,
    name: `Pré-Composição ${project.compositions.length + 1}`,
    tracks: project.tracks.map((t) => ({ ...t, id: uid('track') })),
    clips: selected.map((c) => ({
      ...c,
      startTime: Number((c.startTime - minStart).toFixed(2)),
    })),
    markers: [],
  };

  // Map track IDs
  const trackIdMap = new Map<string, string>();
  for (let i = 0; i < project.tracks.length; i++) {
    trackIdMap.set(project.tracks[i].id, precompComposition.tracks[i].id);
  }
  precompComposition.clips = precompComposition.clips.map((c) => ({
    ...c,
    trackId: trackIdMap.get(c.trackId) || precompComposition.tracks[0].id,
  }));

  const remainingClips = project.clips.filter((c) => !clipIds.includes(c.id));
  const newPrecompClip = {
    id: precompClipId,
    trackId: project.tracks[0].id,
    type: 'precomp' as const,
    name: precompComposition.name,
    startTime: minStart,
    duration: precompDuration,
    trimStart: 0,
    maxDuration: precompDuration,
    x: 0,
    y: 0,
    scale: 100,
    rotation: 0,
    opacity: 100,
    flipH: false,
    flipV: false,
    fitMode: 'contain' as const,
    speed: 1,
    motionPreset: 'none' as const,
    filters: { brightness: 100, contrast: 100, saturation: 100, temperature: 0, hue: 0, blur: 0, vignette: 0, presetName: 'Normal' },
    transitionIn: 'none' as const,
    transitionInDuration: 0,
    transitionOut: 'none' as const,
    transitionOutDuration: 0,
    volume: 0,
    muted: true,
    fadeIn: 0,
    fadeOut: 0,
  };

  const nextProject: ProjectState = {
    ...project,
    compositions: [...project.compositions, precompComposition],
    clips: [...remainingClips, newPrecompClip],
  };

  return { nextProject, precompClipId };
}

export function validateAndNormalizeProject(raw: any) {
  if (!raw || typeof raw !== 'object') return { project: null, error: 'JSON inválido' };
  return {
    project: {
      projectName: raw.projectName || 'Projeto Importado',
      aspectRatio: raw.aspectRatio || '16:9',
      fps: raw.fps || 30,
      backgroundColor: raw.backgroundColor || '#000000',
      transparentBg: !!raw.transparentBg,
      tracks: raw.tracks || [],
      clips: raw.clips || [],
      markers: raw.markers || [],
      compositions: raw.compositions || [],
      activeCompId: raw.activeCompId || 'comp-main',
      assetRegistry: raw.assetRegistry || [],
    },
    error: null,
  };
}
