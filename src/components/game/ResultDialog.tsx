"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { GameState } from "@/domain/game";
import { jumpsOf } from "@/domain/game";
import { useI18n } from "@/i18n/provider";
import type { FinishResult } from "@/lib/api-client";
import { formatClock } from "@/lib/format";
import { nodeKey } from "@/lib/steps";
import { Countdown } from "./Countdown";
import { LevelBadge } from "./LevelBadge";
import { PathChain, type ChainNode } from "./PathChain";
import s from "./game.module.css";

interface ResultDialogProps {
  open: boolean;
  game: GameState;
  labels: Record<string, string>;
  result: FinishResult | null;
  /** Racha actual del desafío diario, para mostrarla al ganar. */
  streak?: number;
  validation: "idle" | "pending" | "error";
  originName: string;
  destinationName: string;
  onClose: () => void;
  onRetry: () => void;
}

/** Resumen de la partida. Se abre solo al terminar y se puede volver a abrir desde la pantalla. */
export function ResultDialog({
  open,
  game,
  labels,
  result,
  streak = 0,
  validation,
  originName,
  destinationName,
  onClose,
  onRetry,
}: ResultDialogProps) {
  const { locale, t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // El foco inicial va al título (no al último botón): así el resumen se abre desde arriba.
      dialog.scrollTop = 0;
      titleRef.current?.focus({ preventScroll: true });
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const won = game.status === "won";
  const jumps = jumpsOf(game);
  const elapsed = (game.finishedAt ?? 0) - (game.startedAt ?? 0);
  const yourPath: ChainNode[] = game.path.map((n) => ({
    type: n.type,
    id: n.id,
    label: labels[nodeKey(n)] ?? String(n.id),
  }));

  const samePath =
    result !== null &&
    result.optimal.path.length === yourPath.length &&
    result.optimal.path.every((n, i) => n.type === yourPath[i].type && n.id === yourPath[i].id);

  return (
    <dialog
      ref={ref}
      className={`${s.dialog} paper`}
      aria-labelledby="result-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={won ? s.dialogHead : `${s.dialogHead} ${s.lost}`}>
        <h2 id="result-title" className={s.dialogTitle} ref={titleRef} tabIndex={-1}>
          {won
            ? t("result.winTitle")
            : game.gaveUp
              ? t("result.gaveUpTitle")
              : t("result.loseTitle")}
        </h2>
        <p className={s.dialogLead}>
          {won
            ? t("result.winLead", { from: originName, to: destinationName })
            : game.gaveUp
              ? t("result.gaveUpLead", { to: destinationName })
              : t("result.loseLead", { to: destinationName })}
        </p>
      </div>

      <div className={s.dialogBody}>
        <div className={s.stats}>
          <div className={s.stat}>
            <span className={s.statLabel}>{t("result.time")}</span>
            <span className={s.statValue}>{formatClock(elapsed)}</span>
          </div>
          <div className={s.stat}>
            <span className={s.statLabel}>{t("result.jumps")}</span>
            <span className={s.statValue}>{jumps}</span>
          </div>
        </div>

        {result && <LevelBadge difficulty={result.difficulty} />}
        {won && streak > 0 && (
          <p className={s.streakLine}>
            {t("result.streak", {
              days: t(streak === 1 ? "stats.day" : "stats.days", { n: streak }),
            })}
          </p>
        )}

        {validation === "pending" && <p className={s.statusLine}>{t("result.validating")}</p>}
        {validation === "error" && (
          <div>
            <p className={s.statusLine}>{t("result.validationError")}</p>
            <button type="button" className="btn btn-ghost" onClick={onRetry}>
              {t("result.retry")}
            </button>
          </div>
        )}

        {result && (
          <p className={s.compare}>
            {result.isOptimal
              ? t("result.optimalYes")
              : t("result.optimalNo", { optimal: result.optimal.length, jumps: result.jumps })}{" "}
            {result.optimal.pathsCount === 1
              ? t("result.pathsCountOne")
              : t("result.pathsCount", { count: result.optimal.pathsCount })}
          </p>
        )}

        <div className={s.pathCols}>
          <div>
            <h3 className={s.pathTitle}>{t("result.yourPath")}</h3>
            <PathChain nodes={yourPath} label={t("result.yourPath")} />
          </div>
          {result && !samePath && (
            <div>
              <h3 className={s.pathTitle}>{t("result.optimalPath")}</h3>
              <PathChain nodes={result.optimal.path} label={t("result.optimalPath")} />
            </div>
          )}
        </div>

        <p className={s.statusLine}>
          {t("result.nextIn", { time: "" }).trim()} <Countdown />
        </p>

        <div className={s.dialogActions}>
          <Link className="btn btn-primary" href={`/${locale}`}>
            {t("result.home")}
          </Link>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("result.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
