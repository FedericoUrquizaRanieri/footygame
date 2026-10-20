import type { CSSProperties } from "react";
import { initials, kitFor } from "@/lib/kits";
import { playerPhotoSrc } from "@/lib/player-photos";
import { PlayerPhoto } from "./PlayerPhoto";
import s from "./ui.module.css";

interface MonogramProps {
  id?: number;
  name?: string;
  /** Texto del círculo "misterioso" (por defecto "?"). */
  label?: string;
  size?: string;
  className?: string;
}

/** Círculo con las iniciales del jugador; si hay foto, un retrato vertical para que se vea la cara. Sin id, se dibuja el círculo "misterioso" de la ruta. */
export function Monogram({ id, name, label, size, className }: MonogramProps) {
  const mystery = id === undefined || name === undefined;
  const portrait = !mystery && playerPhotoSrc(id) !== null;
  const kit = mystery ? null : kitFor(id);
  const style = {
    ...(size ? { "--s": size } : {}),
    ...(kit ? { "--bg": kit.bg, "--fg": kit.fg } : {}),
  } as CSSProperties;
  return (
    <span
      className={[s.monogram, mystery ? s.mystery : "", portrait ? s.portrait : "", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-hidden="true"
    >
      {mystery ? (label ?? "?") : initials(name)}
      {!mystery && <PlayerPhoto id={id} sizes="96px" />}
    </span>
  );
}
