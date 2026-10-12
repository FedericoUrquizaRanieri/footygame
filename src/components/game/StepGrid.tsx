"use client";

import { useRef, useState } from "react";
import { Sticker } from "@/components/ui/Sticker";
import { Shield } from "@/components/ui/Shield";
import { filterByName } from "@/domain/search";
import { useI18n } from "@/i18n/provider";
import { prefetchStep } from "@/lib/api-client";
import { nodeKey, type Step, type StepItem } from "@/lib/steps";
import s from "./game.module.css";

interface StepGridProps {
  step: Step | null;
  status: "loading" | "ready" | "error";
  /** Id del jugador destino: si aparece en la lista se resalta. */
  destinationId: number;
  onPick: (item: StepItem) => void;
  onRetry: () => void;
}

/** Buscador y grilla de opciones del paso actual. */
export function StepGrid({ step, status, destinationId, onPick, onRetry }: StepGridProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const forPlayer = step?.node.type === "player";
  const items = step?.items ?? [];
  const visible = filterByName(
    items.map((item) => ({ ...item, name: item.fullLabel })),
    query,
  );

  const pick = (item: StepItem) => {
    setQuery("");
    onPick(item);
  };

  return (
    <section aria-label={forPlayer ? t("play.pickClub") : t("play.pickPlayer")}>
      <div className={s.listHead}>
        <h2 className={s.listTitle}>{forPlayer ? t("play.pickClub") : t("play.pickPlayer")}</h2>
        {status === "ready" && (
          <span className={s.count}>{t("play.optionsCount", { count: items.length })}</span>
        )}
      </div>

      <div className={s.search}>
        <label className="sr-only" htmlFor="step-search">
          {forPlayer ? t("play.searchClub") : t("play.searchPlayer")}
        </label>
        <input
          id="step-search"
          ref={inputRef}
          className={s.searchInput}
          type="search"
          inputMode="search"
          enterKeyHint="go"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={forPlayer ? t("play.searchClub") : t("play.searchPlayer")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim() && visible[0]) pick(visible[0]);
            if (e.key === "Escape") setQuery("");
          }}
        />
        {query && (
          <button
            type="button"
            className={s.clear}
            aria-label={t("play.clearSearch")}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {status === "loading" && (
        <ul className={s.grid} aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className={s.skeleton} />
          ))}
        </ul>
      )}

      {status === "error" && (
        <div className={s.notice} role="alert">
          <p className={s.noticeTitle}>{t("play.loadError")}</p>
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            {t("play.retry")}
          </button>
        </div>
      )}

      {status === "ready" && visible.length === 0 && (
        <div className={s.notice}>
          <p className={s.noticeTitle}>{t("play.noResults", { query })}</p>
          <p className={s.noticeText}>{t("play.noResultsHint")}</p>
        </div>
      )}

      {status === "ready" && visible.length > 0 && (
        <ul className={s.grid}>
          {visible.map((item) => {
            const isTarget = item.node.type === "player" && item.node.id === destinationId;
            return (
              <li key={nodeKey(item.node)}>
                <button
                  type="button"
                  className={[
                    s.card,
                    isTarget ? s.isTarget : "",
                    item.node.type === "player" ? s.playerCard : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => pick(item)}
                  onPointerEnter={() => prefetchStep(item.node)}
                  onFocus={() => prefetchStep(item.node)}
                >
                  {item.node.type === "player" ? (
                    <Sticker id={item.kitId} name={item.label} target={isTarget} tall />
                  ) : (
                    <>
                      <Shield id={item.kitId} name={item.label} size="2.6rem" />
                      <span className={s.cardText}>
                        <span className={s.cardName}>{item.label}</span>
                        {item.sublabel && <span className={s.cardSub}>{item.sublabel}</span>}
                      </span>
                    </>
                  )}
                  {isTarget && <span className={s.targetTag}>{t("play.target")}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
