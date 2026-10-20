import type { CSSProperties } from "react";
import { initials, kitFor } from "@/lib/kits";
import { playerPhotoSrc } from "@/lib/player-photos";
import { Flag } from "./Flag";
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
  /** Datos fijos de su ficha, arriba de la figurita: bandera y posición. Con `{}` reserva el lugar aunque falten. */
  profile?: {
    flagSrc?: string;
    /** Nombre del país y de la posición, para lectores de pantalla. */
    country?: string;
    position?: { short: string; long: string };
  };
  /** Dato al pie de la figurita (p. ej. "Valor €30 M"). Con texto vacío reserva el lugar para igualar alturas. */
  meta?: string;
  /** Figurita brillante: las estrellas del plantel. */
  foil?: boolean;
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
  profile,
  meta,
  foil = false,
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
    foil ? s.foil : "",
  ]
    .filter(Boolean)
    .join(" ");
  const hasTop = profile !== undefined || foil;
  return (
    <span className={className} style={style}>
      <span className={s.frame}>
        {hasTop && (
          <span className={s.top} aria-hidden="true">
            {profile?.flagSrc && <Flag src={profile.flagSrc} />}
            {profile?.position && <span className={s.topText}>{profile.position.short}</span>}
            {foil && <span className={s.star}>★</span>}
          </span>
        )}
        <span className={s.band} aria-hidden="true">
          {initials(name)}
          <PlayerPhoto id={id} sizes="176px" />
        </span>
      </span>
      {profile && (profile.country || profile.position) && (
        <span className="sr-only">
          {[profile.country, profile.position?.long].filter(Boolean).join(", ")}
        </span>
      )}
      <span className={s.name}>
        <span
          className={name.length > 28 ? s.nameXLong : name.length > 18 ? s.nameLong : undefined}
        >
          {name}
        </span>
      </span>
      {meta !== undefined && <span className={s.meta}>{meta || " "}</span>}
    </span>
  );
}
