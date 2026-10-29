import { useMemo, useState, useCallback, useRef } from 'react';
import { MediaAsset, PreviewResolution, ProjectState, WorkArea } from '../types/editor';
import { PreviewCacheManager, PreviewFrameCache } from '../utils/previewCache';

export interface PreviewRenderState {
  status: 'idle' | 'rendering' | 'cached' | 'error';
  progress: number;
  frameCount: number;
  bytes: number;
  error?: string | null;
  ranges: { start: number; end: number }[];
}

export interface PreviewRenderOptions {
  currentTime: number;
  duration: number;
  playing: boolean;
  suspended: boolean;
}

export function usePreviewRender(
  project: ProjectState,
  assetsMap: Map<string, MediaAsset>,
  resolution: PreviewResolution,
  options: PreviewRenderOptions
) {
  const cacheManagerRef = useRef<PreviewCacheManager>(new PreviewCacheManager());
  const [autoEnabled, setAutoEnabled] = useState<boolean>(true);
  const [autoBusy, setAutoBusy] = useState<boolean>(false);
  const [state, setState] = useState<PreviewRenderState>({
    status: 'idle',
    progress: 0,
    frameCount: 0,
    bytes: 0,
    ranges: [],
  });

  const render = useCallback(async (workArea: WorkArea) => {
    setState((prev) => ({ ...prev, status: 'rendering', progress: 0 }));
    // Simulate RAM cache rendering
    for (let p = 0; p <= 100; p += 25) {
      await new Promise((r) => setTimeout(r, 60));
      setState((prev) => ({
        ...prev,
        progress: p,
        frameCount: Math.round((p / 100) * 120),
        bytes: Math.round((p / 100) * 12 * 1024 * 1024),
      }));
    }
    setState((prev) => ({
      ...prev,
      status: 'cached',
      progress: 100,
      ranges: [{ start: workArea.start, end: workArea.end }],
    }));
  }, []);

  const cancel = useCallback(() => {
    setState((prev) => ({ ...prev, status: 'idle', progress: 0 }));
  }, []);

  const clear = useCallback(() => {
    cacheManagerRef.current.clear();
    setState({
      status: 'idle',
      progress: 0,
      frameCount: 0,
      bytes: 0,
      ranges: [],
    });
  }, []);

  return {
    cache: cacheManagerRef.current as PreviewFrameCache,
    state,
    render,
    cancel,
    clear,
    autoEnabled,
    setAutoEnabled,
    autoBusy,
  };
}
