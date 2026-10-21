"use client";

import { useState, type FormEvent } from "react";
import { FEEDBACK_MAX, REMOVAL_MAX } from "@/lib/feedback-limits";
import { useI18n } from "@/i18n/provider";
import s from "./feedback-form.module.css";

type Kind = "feedback" | "removal";
type Status = "idle" | "sending" | "sent" | "error";

/** Formulario de contacto. "feedback": mensaje corto y mail opcional. "removal": mensaje largo y mail obligatorio. */
export function FeedbackForm({ kind }: { kind: Kind }) {
  const { locale, t } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const removal = kind === "removal";
  const max = removal ? REMOVAL_MAX : FEEDBACK_MAX;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          locale,
          message: data.get("message"),
          contact: data.get("contact"),
          website: data.get("website"),
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className={s.done} role="status">
        {t(`form.${kind}Sent`)}
      </p>
    );
  }

  return (
    <form className={s.form} onSubmit={onSubmit}>
      <label className={s.field}>
        <span>{t(`form.${kind}Message`)}</span>
        <textarea
          name="message"
          required
          maxLength={max}
          rows={removal ? 9 : 3}
          className={removal ? s.tall : undefined}
        />
      </label>
      <label className={s.field}>
        <span>{t(removal ? "form.contactRequired" : "form.contactOptional")}</span>
        <input
          name="contact"
          type="email"
          required={removal}
          maxLength={254}
          autoComplete="email"
        />
      </label>
      {/* Campo trampa contra bots: oculto para las personas. */}
      <div className={s.trap} aria-hidden="true">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
        {t(status === "sending" ? "form.sending" : "form.send")}
      </button>
      {status === "error" && (
        <p className={s.error} role="alert">
          {t("form.error")}
        </p>
      )}
    </form>
  );
}
