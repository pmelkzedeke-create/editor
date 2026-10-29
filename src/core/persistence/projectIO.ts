import { MediaAsset, PersistedAsset } from '../../types/editor';

export function toPersistedAsset(asset: MediaAsset): PersistedAsset {
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    duration: asset.duration,
    width: asset.width,
    height: asset.height,
  };
}

export async function rehydrateAssetsFromRegistry(
  registry?: PersistedAsset[]
): Promise<{ assets: MediaAsset[]; missing: PersistedAsset[] }> {
  if (!registry || !registry.length) {
    return { assets: [], missing: [] };
  }
  const assets: MediaAsset[] = [];
  const missing: PersistedAsset[] = [];

  for (const item of registry) {
    // If it's one of the sample images, we can restore it from local paths
    if (item.name.toLowerCase().includes('studio')) {
      assets.push({
        ...item,
        url: '/public/samples/scene-studio-creator.jpg',
        thumbnail: '/public/samples/scene-studio-creator.jpg',
      });
    } else if (item.name.toLowerCase().includes('mountain') || item.name.toLowerCase().includes('drone')) {
      assets.push({
        ...item,
        url: '/public/samples/scene-mountain-drone.jpg',
        thumbnail: '/public/samples/scene-mountain-drone.jpg',
      });
    } else if (item.name.toLowerCase().includes('neon')) {
      assets.push({
        ...item,
        url: '/public/samples/scene-neon-city.jpg',
        thumbnail: '/public/samples/scene-neon-city.jpg',
      });
    } else {
      missing.push(item);
    }
  }

  return { assets, missing };
}
