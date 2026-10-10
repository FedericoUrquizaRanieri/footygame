import type { CSSProperties } from "react";
import { Monogram } from "@/components/ui/Monogram";
import { Shield } from "@/components/ui/Shield";
import { Sticker } from "@/components/ui/Sticker";
import type { TFunction } from "@/i18n/translate";
import s from "./landing.module.css";

interface PlayerRef {
  id: number;
  name: string;
}

interface PassMapProps {
  t: TFunction;
  origin: PlayerRef;
  destination: PlayerRef;
  dateLabel?: string;
  /** false: se muestra ya armado, sin la animación de entrada (pantalla previa del juego). */
  animate?: boolean;
  /** Rótulos sobre cada extremo ("Salís de" / "Llegás a"). */
  captions?: { origin: string; destination: string };
}

const at = (j: number) => ({ "--j": j }) as CSSProperties;

/**
 * La estructura real del juego, dibujada: jugador, club-temporada, compañero, club-temporada, jugador.
 * Se arma sola al cargar (única animación autónoma de la página).
 */
export function PassMap({
  t,
  origin,
  destination,
  dateLabel,
  animate = true,
  captions,
}: PassMapProps) {
  return (
    <div className={s.routeBlock}>
      <div
        className={animate ? s.route : `${s.route} ${s.still}`}
        role="group"
        aria-label={t("landing.routeLabel", { from: origin.name, to: destination.name })}
      >
        <div className={`${s.node} ${s.origin}`} style={at(0)}>
          {captions && <span className={s.endCaption}>{captions.origin}</span>}
          <Sticker id={origin.id} name={origin.name} tilt={-2} />
        </div>

        <div className={s.mid}>
          <span className={s.link} style={at(1)} aria-hidden="true" />
          <div className={s.node} style={at(2)}>
            <Shield size="3.4rem" />
            <span className={s.caption}>{t("landing.routeClub")}</span>
          </div>
          <span className={s.link} style={at(3)} aria-hidden="true" />
          <div className={s.node} style={at(4)}>
            <Monogram size="3.4rem" />
            <span className={s.caption}>{t("landing.routePlayer")}</span>
          </div>
          <span className={s.link} style={at(5)} aria-hidden="true" />
          <div className={s.node} style={at(6)}>
            <Shield size="3.4rem" />
            <span className={s.caption}>{t("landing.routeClub")}</span>
          </div>
          <span className={s.link} style={at(7)} aria-hidden="true" />
        </div>

        <div className={`${s.node} ${s.dest}`} style={at(8)}>
          {captions && <span className={s.endCaption}>{captions.destination}</span>}
          <Sticker id={destination.id} name={destination.name} tilt={2} target />
        </div>
      </div>
      {dateLabel && <p className={s.routeDate}>{t("landing.challengeOf", { date: dateLabel })}</p>}
    </div>
  );
}
