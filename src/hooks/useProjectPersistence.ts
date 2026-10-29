import { useCallback, useEffect, useState } from 'react';
import { MediaAsset, PersistedAsset, ProjectState, SaveStatus } from '../types/editor';

interface ProjectPersistenceProps {
  project: ProjectState;
  assets: MediaAsset[];
  onProjectRestored: (project: ProjectState) => void;
  onAssetsRestored: (assets: MediaAsset[]) => void;
  onAssetUpdated: (asset: MediaAsset) => void;
  showToast: (msg: string) => void;
}

const STORAGE_KEY = 'otto_project_autosave_v1';

export function useProjectPersistence({
  project,
  assets,
  onProjectRestored,
  onAssetsRestored,
  onAssetUpdated,
  showToast,
}: ProjectPersistenceProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(Date.now());
  const [missingAssets, setMissingAssets] = useState<PersistedAsset[]>([]);
  const [sessionAvailable, setSessionAvailable] = useState<boolean>(false);
  const [canRecoverAtBoot, setCanRecoverAtBoot] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSessionAvailable(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveNow = useCallback(async () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setLastSavedAt(Date.now());
      setSaveStatus('saved');
      showToast('Projeto salvo com sucesso!');
    } catch {
      setSaveStatus('error');
      showToast('Erro ao salvar no navegador.');
    }
  }, [project, showToast]);

  const recoverSession = useCallback(async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        onProjectRestored(parsed);
        showToast('Sessão restaurada!');
      }
    } catch {
      showToast('Falha ao restaurar sessão.');
    }
  }, [onProjectRestored, showToast]);

  const discardSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSessionAvailable(false);
      setCanRecoverAtBoot(false);
      showToast('Sessão descartada.');
    } catch {
      // ignore
    }
  }, [showToast]);

  const exportPackage = useCallback(() => {
    const data = JSON.stringify({ project, assets: assets.map((a) => ({ id: a.id, name: a.name, type: a.type })) }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.projectName.toLowerCase().replace(/\s+/g, '-')}.ottoproj.json`;
    a.click();
    showToast('Pacote de projeto exportado!');
  }, [project, assets, showToast]);

  const importPackage = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.project) {
        onProjectRestored(parsed.project);
        showToast('Pacote carregado com sucesso!');
      }
    } catch {
      showToast('Arquivo de pacote inválido.');
    }
  }, [onProjectRestored, showToast]);

  const relinkAsset = useCallback(async (assetId: string, file: File): Promise<boolean> => {
    const url = URL.createObjectURL(file);
    onAssetUpdated({
      id: assetId,
      name: file.name,
      type: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image',
      url,
      duration: 10,
    });
    setMissingAssets((prev) => prev.filter((a) => a.id !== assetId));
    showToast(`Mídia "${file.name}" relinkada!`);
    return true;
  }, [onAssetUpdated, showToast]);

  const clearMissing = useCallback(() => {
    setMissingAssets([]);
  }, []);

  return {
    saveStatus,
    lastSavedAt,
    missingCount: missingAssets.length,
    missingAssets,
    sessionAvailable,
    canRecoverAtBoot,
    saveNow,
    recoverSession,
    discardSession,
    exportPackage,
    importPackage,
    relinkAsset,
    clearMissing,
  };
}
