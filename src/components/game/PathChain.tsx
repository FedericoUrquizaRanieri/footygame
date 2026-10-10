import { Monogram } from "@/components/ui/Monogram";
import { Shield } from "@/components/ui/Shield";
import { clubIdOf } from "@/lib/steps";
import s from "./game.module.css";

export interface ChainNode {
  type: "player" | "club-season";
  id: number;
  label: string;
}

/** Camino como cadena vertical: círculo = jugador, escudo = club y temporada. */
export function PathChain({ nodes, label }: { nodes: ChainNode[]; label: string }) {
  return (
    <ol className={s.chain} aria-label={label}>
      {nodes.map((n, i) => (
        <li key={`${n.type}:${n.id}:${i}`} className={s.chainItem}>
          {n.type === "player" ? (
            <Monogram id={n.id} name={n.label} size="2.2rem" />
          ) : (
            <Shield id={clubIdOf(n.id)} name={n.label} size="1.9rem" />
          )}
          <span className={s.chainLabel}>{n.label}</span>
        </li>
      ))}
    </ol>
  );
}
