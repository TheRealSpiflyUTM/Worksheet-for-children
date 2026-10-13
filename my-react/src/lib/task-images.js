export function photoUrl(assetId, fallback) {
  return assetId ? `/api/minigame-assets/${assetId}/content` : fallback;
}
