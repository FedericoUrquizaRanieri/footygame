"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Monogram } from "@/components/ui/Monogram";
import { currentNode, elapsedMs, giveUp, jumpsOf, selectNode, type GameState } from "@/domain/game";
import { MAX_JUMPS } from "@/domain/types";
import { useI18n } from "@/i18n/provider";
import { fetchStep, finishChallenge, type FinishResult } from "@/lib/api-client";
import { entryFromResult, readHistory, recordResult } from "@/lib/history-store";
import { nodeKey, type Step, type StepItem } from "@/lib/steps";
import {
  readArchiveSession,
  readTodaySession,
  writeGame,
  writeLabels,
  writeResult,
  type Scope,
} from "@/lib/game-store";
import { challengeDateFor } from "@/domain/daily-date";
import { computeStats } from "@/domain/stats";
import { useNow } from "@/lib/use-now";
import { Clock } from "./Clock";
import { DestinationDialog } from "./DestinationDialog";
import { GiveUpDialog } from "./GiveUpDialog";
import { NodeHeader } from "./NodeHeader";
import { PathChain, type ChainNode } from "./PathChain";
import { ResultDialog } from "./ResultDialog";
import { Scoreboard } from "./Scoreboard";
import { StepGrid } from "./StepGrid";
import s from "./game.module.css";

type StepState =
  | { status: "loading"; data?: undefined }
  | { status: "ready"; data: Step }
  | { status: "error"; data?: undefined };

type Validation = "idle" | "pending" | "error";

/** Pantalla de juego: nodo actual, buscador, opciones, y el marcador con tiempo y saltos. */
interface PlayScreenProps {
  /** "daily": el desafío de hoy. "archive": un desafío pasado, de práctica. */
  mode?: "daily" | "archive";
  /** Fecha del desafío pasado (solo en modo archive). */
  date?: string;
}

export function PlayScreen({ mode = "daily", date }: PlayScreenProps) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const archive = mode === "archive" && date !== undefined;
  const scope = useMemo<Scope>(
    () => (mode === "archive" && date !== undefined ? { archive: date } : "daily"),
    [mode, date],
  );
  const base = archive ? `/${locale}/archive/${date}` : `/${locale}/daily`;
  const recordMode = archive ? "archive" : "daily";

  const [ready, setReady] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FinishResult | null>(null);
  const [validation, setValidation] = useState<Validation>("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pathOpen, setPathOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [step, setStep] = useState<StepState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // La partida vive también en una ref para que dos toques seguidos no lean un estado viejo.
  const gameRef = useRef<GameState | null>(null);
  const labelsRef = useRef<Record<string, string>>({});
  const headingRef = useRef<HTMLDivElement>(null);

  const playing = game?.status === "playing";
  const now = useNow(playing ? 250 : null);

  const runFinish = useCallback(
    async (g: GameState) => {
      setValidation("pending");
      try {
        const response = await finishChallenge({
          challengeId: g.challenge.id,
          path: g.path,
          elapsedMs: (g.finishedAt ?? Date.now()) - (g.startedAt ?? Date.now()),
          gaveUp: g.gaveUp,
        });
        writeResult(response, scope);
        recordResult(entryFromResult(g, response, recordMode));
        if (!archive) {
          setStreak(computeStats(readHistory(), challengeDateFor(Date.now())).currentStreak);
        }
        setResult(response);
        setValidation("idle");
      } catch {
        setValidation("error");
      }
    },
    [scope, recordMode, archive],
  );

  // Carga la partida guardada. Sin partida iniciada hoy, vuelve a la pantalla previa.
  useEffect(() => {
    const session = archive && date ? readArchiveSession(date) : readTodaySession();
    if (!session || session.game.status === "ready") {
      router.replace(base);
      return;
    }
    gameRef.current = session.game;
    labelsRef.current = session.labels;
    /* eslint-disable react-hooks/set-state-in-effect */
    setGame(session.game);
    setLabels(session.labels);
    setResult(session.result);
    if (session.result && session.game.status !== "playing") {
      recordResult(entryFromResult(session.game, session.result, recordMode));
      if (!archive) {
        setStreak(computeStats(readHistory(), challengeDateFor(Date.now())).currentStreak);
      }
    }
    setReady(true);
    if (session.game.status !== "playing") {
      setDialogOpen(true);
      if (!session.result) void runFinish(session.game);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [archive, base, date, recordMode, router, runFinish]);

  const node = game ? currentNode(game) : null;
  const nodeId = node ? nodeKey(node) : null;

  // Carga las opciones del nodo actual.
  useEffect(() => {
    if (!playing || !node) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep({ status: "loading" });
    fetchStep(node)
      .then((data) => {
        if (!alive) return;
        setStep({ status: "ready", data });
        // El botón que se tocó ya no existe: el foco pasa al título para lectores de pantalla y teclado.
        if (!document.activeElement || document.activeElement === document.body) {
          headingRef.current?.focus({ preventScroll: true });
        }
      })
      .catch(() => alive && setStep({ status: "error" }));
    return () => {
      alive = false;
    };
    // `node` cambia de identidad en cada render; la clave estable es nodeId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, playing, attempt]);

  const onPick = useCallback(
    (item: StepItem) => {
      const current = gameRef.current;
      if (!current || current.status !== "playing") return;
      let next: GameState;
      try {
        next = selectNode(current, item.node, Date.now());
      } catch {
        return; // toque duplicado sobre un nodo que ya no corresponde
      }
      gameRef.current = next;
      labelsRef.current = { ...labelsRef.current, [nodeKey(item.node)]: item.fullLabel };
      writeGame(next, scope);
      writeLabels(labelsRef.current, scope);
      setLabels(labelsRef.current);
      setGame(next);
      setPathOpen(false);
      window.scrollTo({ top: 0 });
      if (next.status !== "playing") {
        setDialogOpen(true);
        void runFinish(next);
      }
    },
    [runFinish, scope],
  );

  const onGiveUp = useCallback(() => {
    const current = gameRef.current;
    if (!current || current.status !== "playing") return;
    let next: GameState;
    try {
      next = giveUp(current, Date.now());
    } catch {
      return;
    }
    gameRef.current = next;
    writeGame(next, scope);
    setGame(next);
    setConfirmOpen(false);
    setPathOpen(false);
    window.scrollTo({ top: 0 });
    setDialogOpen(true);
    void runFinish(next);
  }, [runFinish, scope]);

  if (!ready || !game || !node) {
    return (
      <div className={`container ${s.main}`} aria-busy="true">
        <p className="sr-only">{t("common.loading")}</p>
      </div>
    );
  }

  const label = (n: { type: "player" | "club-season"; id: number }) =>
    labels[nodeKey(n)] ?? String(n.id);
  const jumps = jumpsOf(game);
  const elapsed = elapsedMs(game, now);
  const destination = {
    id: game.challenge.destinationId,
    name: label({ type: "player", id: game.challenge.destinationId }),
  };
  const origin = label({ type: "player", id: game.challenge.originId });
  const path: ChainNode[] = game.path.map((n) => ({ type: n.type, id: n.id, label: label(n) }));
  const fromStep = step.status === "ready" && nodeKey(step.data.node) === nodeId ? step.data : null;
  const title = fromStep?.title ?? label(node);
  const stepForGrid = playing ? fromStep : null;
  const gridStatus: "loading" | "ready" | "error" = !playing
    ? "ready"
    : fromStep
      ? "ready"
      : step.status === "error"
        ? "error"
        : "loading";

  return (
    <>
      <div className={s.topbar}>
        <div className={`container ${s.topbarRow}`}>
          <div className={s.topStat}>
            <span className={s.topLabel}>{t("play.time")}</span>
            <span className={s.topValue}>
              <Clock ms={elapsed} />
            </span>
          </div>
          <div className={s.topStat}>
            <span className={s.topLabel}>{t("play.jumps")}</span>
            <span className={s.topValue}>{t("play.jumpsOf", { n: jumps, max: MAX_JUMPS })}</span>
          </div>
          <button
            type="button"
            className={s.targetBtn}
            aria-expanded={pathOpen}
            aria-controls="path-drawer"
            onClick={() => setPathOpen((v) => !v)}
          >
            <span className={s.targetName}>
              {t("play.target")}: {destination.name}
            </span>
            <Monogram id={destination.id} name={destination.name} size="2rem" />
          </button>
        </div>
        {pathOpen && (
          <div id="path-drawer" className={`container ${s.drawer}`}>
            <PathChain nodes={path} label={t("play.path")} />
            <p className={s.sideNote}>{t("play.backHint")}</p>
            <button
              type="button"
              className={`btn btn-ghost ${s.giveUpBtn}`}
              onClick={() => {
                setPathOpen(false);
                setDestinationOpen(true);
              }}
            >
              {t("play.viewClubsShort")}
            </button>
            {playing && (
              <button
                type="button"
                className={`btn btn-ghost ${s.giveUpBtn}`}
                onClick={() => setConfirmOpen(true)}
              >
                {t("play.giveUp")}
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`container ${s.shell}`}>
        <main id="main" className={s.main}>
          <NodeHeader
            ref={headingRef}
            node={node}
            title={title}
            subtitle={fromStep?.subtitle}
            youAreAt={t("play.youAreAt")}
          />
          {playing && MAX_JUMPS - jumps === 1 && (
            <p className={s.lastJump}>{t("play.lastJumpWarning")}</p>
          )}
          <p className="sr-only" role="status">
            {fromStep ? t("play.announce", { name: title, count: fromStep.items.length }) : ""}
          </p>
          {playing && (
            <StepGrid
              step={stepForGrid}
              status={gridStatus}
              destinationId={destination.id}
              onPick={onPick}
              onRetry={() => setAttempt((n) => n + 1)}
            />
          )}
          {!playing && (
            <div className={s.notice}>
              <button type="button" className="btn btn-primary" onClick={() => setDialogOpen(true)}>
                {t("result.summary")}
              </button>
            </div>
          )}
        </main>

        <Scoreboard
          t={t}
          elapsedMs={elapsed}
          jumps={jumps}
          destination={destination}
          path={path}
          onGiveUp={playing ? () => setConfirmOpen(true) : undefined}
          onDestinationClick={() => setDestinationOpen(true)}
        />
      </div>

      <DestinationDialog
        open={destinationOpen}
        destination={destination}
        onClose={() => setDestinationOpen(false)}
      />

      <GiveUpDialog
        open={confirmOpen && playing}
        onConfirm={onGiveUp}
        onCancel={() => setConfirmOpen(false)}
      />

      {!playing && (
        <ResultDialog
          open={dialogOpen}
          game={game}
          labels={labels}
          result={result}
          streak={streak}
          variant={archive ? "archive" : "daily"}
          validation={validation}
          originName={origin}
          destinationName={destination.name}
          onClose={() => setDialogOpen(false)}
          onRetry={() => void runFinish(game)}
        />
      )}
    </>
  );
}
