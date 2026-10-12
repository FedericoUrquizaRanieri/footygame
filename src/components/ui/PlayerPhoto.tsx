import Image from "next/image";
import { playerPhotoSrc } from "@/lib/player-photos";
import s from "./ui.module.css";

/**
 * Foto del jugador sobre el monograma. Si no hay foto, no dibuja nada y se ve el monograma.
 * El contenedor debe ser `position: relative` con `overflow: hidden`. Decorativa: el nombre va en texto.
 */
export function PlayerPhoto({ id, sizes }: { id: number; sizes: string }) {
  const src = playerPhotoSrc(id);
  if (!src) return null;
  return <Image className={s.photo} src={src} alt="" fill sizes={sizes} />;
}
