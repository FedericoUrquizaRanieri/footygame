import type { CSSProperties } from "react";
import { initials, kitFor } from "@/lib/kits";
import s from "./ui.module.css";

interface StickerProps {
  id: number;
  name: string;
  size?: "sm" | "md" | "lg";
  /** Marca al jugador destino con el borde celeste. */
  target?: boolean;
  /** Inclinación en grados, para que las figuritas no parezcan una grilla. */
  tilt?: number;
}

/** Figurita de jugador. La v1 no usa fotos: monograma sobre los colores de una camiseta. */
export function Sticker({ id, name, size = "md", target = false, tilt = 0 }: StickerProps) {
  const kit = kitFor(id);
  const style = { "--bg": kit.bg, "--fg": kit.fg, "--tilt": `${tilt}deg` } as CSSProperties;
  const className = [s.sticker, size !== "md" ? s[size] : "", target ? s.target : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={className} style={style}>
      <div className={s.band} aria-hidden="true">
        {initials(name)}
      </div>
      <p className={s.name}>{name}</p>
    </div>
  );
}
