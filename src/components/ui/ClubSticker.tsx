import type { CSSProperties } from "react";
import { clubLookFor, readableOn } from "@/lib/club-colors";
import { kitFor } from "@/lib/kits";
import { Shield } from "./Shield";
import s from "./ui.module.css";

interface ClubStickerProps {
  /** Id del club (no de la temporada): define los colores. */
  id: number;
  name: string;
  /** Temporada (p. ej. "2018/19"): el dato principal de la figurita. */
  season?: string;
  /** Nombre de la liga, si se conoce. */
  league?: string | null;
  size?: "md" | "sm";
}

/** Figurita de club: el escudo (con su forma de siempre) dentro de un marco de álbum, con la temporada y la liga. */
export function ClubSticker({ id, name, season, league, size = "md" }: ClubStickerProps) {
  const look = clubLookFor(id);
  const kit = look ? { bg: look.primary, fg: readableOn(look.primary) } : kitFor(id);
  // Con un club de camiseta clara el fondo de la ventana se oscurece más para que el escudo resalte.
  const light = kit.fg === "#14161a";
  const style = {
    "--bg": kit.bg,
    "--fg": kit.fg,
    "--tilt": "0deg",
    "--mix": light ? "16%" : "42%",
  } as CSSProperties;
  return (
    <span
      className={[s.sticker, s.clubSticker, size === "sm" ? s.sm : ""].filter(Boolean).join(" ")}
      style={style}
    >
      <span className={s.frame}>
        {league && (
          <span className={s.top} aria-hidden="true">
            <span className={s.topText}>{league}</span>
          </span>
        )}
        <span className={s.crestWindow} aria-hidden="true">
          <Shield id={id} name={name} size="4.2rem" />
        </span>
      </span>
      <span className={s.name}>
        <span className={name.length > 22 ? s.nameLong : undefined}>{name}</span>
      </span>
      {season && <span className={`${s.meta} ${s.season}`}>{season}</span>}
    </span>
  );
}
