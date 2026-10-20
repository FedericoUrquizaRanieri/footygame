"use client";

import { useRef, useState } from "react";
import { ClubSticker } from "@/components/ui/ClubSticker";
import { Sticker } from "@/components/ui/Sticker";
import { filterByName } from "@/domain/search";
import { useI18n } from "@/i18n/provider";
import { prefetchStep } from "@/lib/api-client";
import { FOIL_VALUE_EUR, formatMarketValue } from "@/lib/format";
import { leagueName } from "@/lib/leagues";
import { nationalityInfo } from "@/lib/nationalities";
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
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const forPlayer = step?.node.type === "player";
  const items = step?.items ?? [];
  const visible = filterByName(
    items.map((item) => ({ ...item, name: item.fullLabel })),
    query,
  );

  // Bandera y posición de la figurita; si el dato falta, la franja queda vacía pero reservada.
  const profileOf = (item: StepItem) => {
    const country = nationalityInfo(item.nationality, locale);
    const pos = item.position;
    return {
      flagSrc: country?.flagSrc,
      country: country?.name,
      position: pos ? { short: t(`positionShort.${pos}`), long: t(`position.${pos}`) } : undefined,
    };
  };

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
                  className={[s.card, isTarget ? s.isTarget : "", s.stickerCard]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => pick(item)}
                  onPointerEnter={() => prefetchStep(item.node)}
                  onFocus={() => prefetchStep(item.node)}
                >
                  {item.node.type === "player" ? (
                    <Sticker
                      id={item.kitId}
                      name={item.label}
                      target={isTarget}
                      tall
                      profile={profileOf(item)}
                      foil={(item.marketValueEur ?? 0) >= FOIL_VALUE_EUR}
                      meta={
                        item.marketValueEur
                          ? t("sticker.value", {
                              value: formatMarketValue(item.marketValueEur, locale),
                            })
                          : t("sticker.noValue")
                      }
                    />
                  ) : (
                    <ClubSticker
                      id={item.kitId}
                      name={item.label}
                      season={item.sublabel}
                      league={leagueName(item.league)}
                    />
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
