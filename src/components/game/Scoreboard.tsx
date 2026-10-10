import { Sticker } from "@/components/ui/Sticker";
import { MAX_JUMPS } from "@/domain/types";
import type { TFunction } from "@/i18n/translate";
import { Clock } from "./Clock";
import { PathChain, type ChainNode } from "./PathChain";
import s from "./game.module.css";

interface ScoreboardProps {
  t: TFunction;
  elapsedMs: number;
  jumps: number;
  destination: { id: number; name: string };
  path: ChainNode[];
}

/** Barra lateral de escritorio: tiempo, saltos, destino y camino recorrido. */
export function Scoreboard({ t, elapsedMs, jumps, destination, path }: ScoreboardProps) {
  const left = MAX_JUMPS - jumps;
  return (
    <aside className={s.sidebar} aria-label={t("play.path")}>
      <div className={s.scoreboard}>
        <div>
          <p className={s.scoreLabel}>{t("play.time")}</p>
          <Clock ms={elapsedMs} big />
        </div>
        <div>
          <p className={s.scoreLabel}>{t("play.jumps")}</p>
          <p className={s.jumpsLine}>
            <span className={s.jumpsBig}>{jumps}</span>
            <span className={s.jumpsOf}>{t("play.ofMax", { max: MAX_JUMPS })}</span>
          </p>
          <div
            className={s.pips}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={MAX_JUMPS}
            aria-valuenow={jumps}
            aria-label={t("play.jumpsLeft", { n: left })}
          >
            {Array.from({ length: MAX_JUMPS }, (_, i) => (
              <span
                key={i}
                className={
                  i < jumps
                    ? left <= 1
                      ? `${s.pip} ${s.on} ${s.warn}`
                      : `${s.pip} ${s.on}`
                    : s.pip
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className={s.sideBlock}>
        <h2 className={s.sideTitle}>{t("play.target")}</h2>
        <Sticker id={destination.id} name={destination.name} size="sm" target />
      </div>

      <div className={s.sideBlock}>
        <h2 className={s.sideTitle}>{t("play.path")}</h2>
        <PathChain nodes={path} label={t("play.path")} />
        <p className={s.sideNote}>{t("play.backHint")}</p>
      </div>
    </aside>
  );
}
