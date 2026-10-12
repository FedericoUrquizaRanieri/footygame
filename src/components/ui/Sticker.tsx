import type { CSSProperties } from "react";
import { initials, kitFor } from "@/lib/kits";
import { playerPhotoSrc } from "@/lib/player-photos";
import { PlayerPhoto } from "./PlayerPhoto";
import s from "./ui.module.css";

interface StickerProps {
  id: number;
  name: string;
  size?: "sm" | "md" | "lg";
  /** Marca al jugador destino con el borde celeste. */
  target?: boolean;
  /** Inclinación en grados, para que las figuritas no parezcan una grilla. */
  tilt?: number;
  /** Solo la foto o el monograma, cuando el nombre ya se muestra al lado (p. ej. en la cabecera). */
  hideName?: boolean;
  /** Fuerza el recuadro vertical aunque no haya foto, para que todas las figuritas de una grilla midan igual. */
  tall?: boolean;
}

/** Figurita de jugador: foto si hay una con licencia libre o, si no, monograma sobre los colores de una camiseta. */
export function Sticker({
  id,
  name,
  size = "md",
  target = false,
  tilt = 0,
  hideName = false,
  tall = false,
}: StickerProps) {
  const kit = kitFor(id);
  const style = { "--bg": kit.bg, "--fg": kit.fg, "--tilt": `${tilt}deg` } as CSSProperties;
  const className = [
    s.sticker,
    size !== "md" ? s[size] : "",
    playerPhotoSrc(id) !== null ? s.hasPhoto : "",
    tall ? s.tall : "",
    target ? s.target : "",
    hideName ? s.noName : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={className} style={style}>
      <span className={s.band} aria-hidden="true">
        {initials(name)}
        <PlayerPhoto id={id} sizes="176px" />
      </span>
      <span className={s.name}>
        <span
          className={name.length > 28 ? s.nameXLong : name.length > 18 ? s.nameLong : undefined}
        >
          {name}
        </span>
      </span>
    </span>
  );
}
