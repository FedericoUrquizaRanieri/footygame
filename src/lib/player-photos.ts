import { PLAYER_PHOTO_IDS } from "./player-photos.generated";

const WITH_PHOTO = new Set<number>(PLAYER_PHOTO_IDS);

/** Ruta propia de la foto del jugador (public/players), o null si no hay una con licencia libre. */
export function playerPhotoSrc(playerId: number): string | null {
  return WITH_PHOTO.has(playerId) ? `/players/${playerId}.jpg` : null;
}
