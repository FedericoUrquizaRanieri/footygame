"use client";

import Image from "next/image";
import { useState } from "react";
import { playerPhotoSrc } from "@/lib/player-photos";
import s from "./ui.module.css";

/**
 * Foto del jugador sobre el monograma. Si no hay foto, o no carga, no dibuja nada y se ve el monograma.
 * El contenedor debe ser `position: relative` con `overflow: hidden`. Decorativa: el nombre va en texto.
 */
export function PlayerPhoto({ id, sizes }: { id: number; sizes: string }) {
  const [failed, setFailed] = useState(false);
  const src = playerPhotoSrc(id);
  if (!src || failed) return null;
  return (
    <Image
      className={s.photo}
      src={src}
      alt=""
      fill
      unoptimized
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
