"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/provider";
import s from "./game.module.css";

interface GiveUpDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación antes de rendirse: la partida termina como derrota y no se puede deshacer. */
export function GiveUpDialog({ open, onConfirm, onCancel }: GiveUpDialogProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // El foco empieza en "Seguir jugando": la opción segura.
      cancelRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${s.dialog} ${s.confirm} paper`}
      aria-labelledby="giveup-title"
      onClose={onCancel}
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
    >
      <div className={s.dialogBody}>
        <h2 id="giveup-title" className={s.confirmTitle}>
          {t("play.giveUpTitle")}
        </h2>
        <p>{t("play.giveUpText")}</p>
        <div className={s.dialogActions}>
          <button ref={cancelRef} type="button" className="btn btn-primary" onClick={onCancel}>
            {t("play.giveUpCancel")}
          </button>
          <button type="button" className={`btn ${s.danger}`} onClick={onConfirm}>
            {t("play.giveUpConfirm")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
