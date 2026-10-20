import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { PointerLight } from "@/components/landing/PointerLight";
import { RouteTicker } from "@/components/landing/RouteTicker";
import { TodayRoute } from "@/components/landing/TodayRoute";
import { ClubSticker } from "@/components/ui/ClubSticker";
import { PitchBackdrop } from "@/components/ui/PitchBackdrop";
import { Sticker } from "@/components/ui/Sticker";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";
import s from "@/components/landing/landing.module.css";

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = createT(getMessages(locale));
  // Cada frase del título es una línea con su propio ancho de letra (ver .titleLine).
  const titleLines = t("landing.title").split(/(?<=\.)\s+/);

  return (
    <>
      <SiteHeader locale={locale} overlay />
      <main id="main">
        <section className={s.hero}>
          <PitchBackdrop zone="center" contained />
          <PointerLight />
          <div className={`container ${s.heroBody}`}>
            <div>
              <h1 className={s.title}>
                {titleLines.map((line, i) => (
                  <span key={line} className={s.titleLine} style={{ "--i": i } as CSSProperties}>
                    <span>{line}</span>
                  </span>
                ))}
              </h1>
              <p className={s.lead}>{t("landing.lead")}</p>
              <div className={s.cta}>
                <Link className="btn btn-primary" href={`/${locale}/daily`}>
                  {t("landing.cta")}
                </Link>
                <Link className="btn btn-ghost" href={`/${locale}/archive`}>
                  {t("archive.link")}
                </Link>
              </div>
            </div>
            <Suspense fallback={null}>
              <TodayRoute locale={locale} />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <RouteTicker locale={locale} />
          </Suspense>
        </section>

        <section className={`${s.section} ${s.how}`} aria-labelledby="how-title">
          <PitchBackdrop zone="corner" calm contained />
          <div className={`container ${s.howGrid}`}>
            <h2 id="how-title" className={s.h2}>
              {t("landing.howTitle")}
            </h2>
            <ol className={s.steps}>
              <li className={s.step}>
                <div className={s.stepArt}>
                  <Sticker id={28003} name="Lionel Messi" tilt={-3} />
                  <span className={s.stepNo} aria-hidden="true">
                    1
                  </span>
                </div>
                <div>
                  <h3 className={s.stepTitle}>{t("landing.step1Title")}</h3>
                  <p className={s.stepText}>{t("landing.step1Text")}</p>
                </div>
              </li>
              <li className={s.step}>
                <div className={s.stepArt}>
                  <ClubSticker
                    id={583}
                    name="Paris Saint-Germain"
                    season="2021/22"
                    league="Ligue 1"
                  />
                  <span className={s.stepNo} aria-hidden="true">
                    2
                  </span>
                </div>
                <div>
                  <h3 className={s.stepTitle}>{t("landing.step2Title")}</h3>
                  <p className={s.stepText}>{t("landing.step2Text")}</p>
                </div>
              </li>
              <li className={s.step}>
                <div className={s.stepArt}>
                  <Sticker
                    id={68290}
                    name="Neymar"
                    tilt={3}
                    target
                    profile={{
                      flagSrc: "/flags/br.png",
                      position: { short: "DEL", long: "Delantero" },
                    }}
                  />
                  <span className={s.stepNo} aria-hidden="true">
                    3
                  </span>
                </div>
                <div>
                  <h3 className={s.stepTitle}>{t("landing.step3Title")}</h3>
                  <p className={s.stepText}>{t("landing.step3Text")}</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className={`${s.section} pitch`} aria-labelledby="rules-title">
          <div className={`container ${s.rulesGrid}`}>
            <div>
              <h2 id="rules-title" className={s.h2}>
                {t("landing.rulesTitle")}
              </h2>
              <ul className={s.rules}>
                <li>{t("landing.rule1")}</li>
                <li>{t("landing.rule2")}</li>
                <li>{t("landing.rule3")}</li>
                <li>{t("landing.rule4")}</li>
              </ul>
            </div>
            <aside className={`${s.dataCard} paper`}>
              <h2>{t("landing.dataTitle")}</h2>
              <p>{t("landing.dataText")}</p>
            </aside>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className="container">
          <p>{t("landing.footer")}</p>
          <p>
            <Link href={`/${locale}/credits`}>{t("credits.title")}</Link> ·{" "}
            <Link href={`/${locale}/legal`}>{t("legal.title")}</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
