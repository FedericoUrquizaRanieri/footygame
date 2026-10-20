import { forwardRef } from "react";
import { Sticker } from "@/components/ui/Sticker";
import { Shield } from "@/components/ui/Shield";
import type { NodeRef } from "@/domain/types";
import { clubIdOf } from "@/lib/steps";
import s from "./game.module.css";

interface NodeHeaderProps {
  node: NodeRef;
  title: string;
  subtitle?: string;
  youAreAt: string;
}

/** Dónde estás parado ahora: ícono grande, nombre en estampado de camiseta y, si es un club, la temporada. */
export const NodeHeader = forwardRef<HTMLDivElement, NodeHeaderProps>(function NodeHeader(
  { node, title, subtitle, youAreAt },
  ref,
) {
  return (
    <div className={s.current}>
      {node.type === "player" ? (
        <Sticker id={node.id} name={title} size="sm" hideName />
      ) : (
        <Shield id={clubIdOf(node.id)} name={title} size="5rem" />
      )}
      <div className={s.currentText} ref={ref} tabIndex={-1}>
        <p className={s.youAre}>{youAreAt}</p>
        <h1 className={s.currentName}>{title}</h1>
        {subtitle && <p className={s.currentSub}>{subtitle}</p>}
      </div>
    </div>
  );
});
