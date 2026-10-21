import { PLAYER_PHOTO_IDS } from "./player-photos.generated";

const WITH_PHOTO = new Set<number>(PLAYER_PHOTO_IDS);

/**
 * Base de las fotos. En producción apunta al bucket público de Supabase Storage (NEXT_PUBLIC_PHOTOS_BASE_URL);
 * sin la variable se sirven desde public/players (desarrollo local).
 */
const PHOTOS_BASE = (process.env.NEXT_PUBLIC_PHOTOS_BASE_URL ?? "/players").replace(/\/$/, "");

/** URL de la foto del jugador, o null si no hay una con licencia libre. */
export function playerPhotoSrc(playerId: number): string | null {
  return WITH_PHOTO.has(playerId) ? `${PHOTOS_BASE}/${playerId}.jpg` : null;
}
