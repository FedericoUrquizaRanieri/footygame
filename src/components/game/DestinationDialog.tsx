"use client";

import { useEffect, useRef, useState } from "react";
import { Shield } from "@/components/ui/Shield";
import { useI18n } from "@/i18n/provider";
import { fetchStep } from "@/lib/api-client";
import { groupByClub, type ClubGroup } from "@/lib/steps";
import s from "./game.module.css";

interface DestinationDialogProps {
  open: boolean;
  destination: { id: number; name: string };
  onClose: () => void;
}

type State = { status: "loading" } | { status: "error" } | { status: "ready"; groups: ClubGroup[] };

/** Clubes donde jugó el jugador destino: una pista para planear el camino. */
export function DestinationDialog({ open, destination, onClose }: DestinationDialogProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.scrollTop = 0;
      titleRef.current?.focus({ preventScroll: true });
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Carga los clubes la primera vez que se abre (queda en memoria para las siguientes).
  useEffect(() => {
    if (!open) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: "loading" });
    fetchStep({ type: "player", id: destination.id })
      .then((step) => alive && setState({ status: "ready", groups: groupByClub(step) }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [open, destination.id, attempt]);

  return (
    <dialog
      ref={ref}
      className={`${s.dialog} ${s.confirm} paper`}
      aria-labelledby="destination-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={s.dialogBody}>
        <h2 id="destination-title" className={s.confirmTitle} ref={titleRef} tabIndex={-1}>
          {t("play.destinationClubs", { name: destination.name })}
        </h2>

        {state.status === "loading" && <p className={s.statusLine}>{t("common.loading")}</p>}

        {state.status === "error" && (
          <div>
            <p className={s.statusLine}>{t("play.loadError")}</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t("play.retry")}
            </button>
          </div>
        )}

        {state.status === "ready" && (
          <ul className={s.clubList}>
            {state.groups.map((g) => (
              <li key={g.kitId} className={s.clubRow}>
                <Shield id={g.kitId} name={g.name} size="2.2rem" />
                <span>
                  <span className={s.clubName}>{g.name}</span>
                  <span className={s.clubSeasons}>{g.seasons.join(", ")}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className={s.dialogActions}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t("result.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
