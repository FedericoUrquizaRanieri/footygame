import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PitchLines } from "@/components/landing/PitchLines";
import { TodayRoute } from "@/components/landing/TodayRoute";
import { Monogram } from "@/components/ui/Monogram";
import { Shield } from "@/components/ui/Shield";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";
import s from "@/components/landing/landing.module.css";

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = createT(getMessages(locale));

  return (
    <>
      <SiteHeader locale={locale} overlay />
      <main id="main">
        <section className={`${s.hero} pitch`}>
          <PitchLines />
          <div className={`container ${s.heroBody}`}>
            <div>
              <h1 className={s.title}>{t("landing.title")}</h1>
              <p className={s.lead}>{t("landing.lead")}</p>
              <div className={s.cta}>
                <Link className="btn btn-primary" href={`/${locale}/daily`}>
                  {t("landing.cta")}
                </Link>
              </div>
            </div>
            <Suspense fallback={null}>
              <TodayRoute locale={locale} />
            </Suspense>
          </div>
        </section>

        <section className={`${s.section} ${s.how}`} aria-labelledby="how-title">
          <div className={`container ${s.howGrid}`}>
            <h2 id="how-title" className={s.h2}>
              {t("landing.howTitle")}
            </h2>
            <ol className={s.steps}>
              <li className={s.step}>
                <Monogram label="1" size="3.5rem" />
                <div>
                  <h3 className={s.stepTitle}>{t("landing.step1Title")}</h3>
                  <p className={s.stepText}>{t("landing.step1Text")}</p>
                </div>
              </li>
              <li className={s.step}>
                <Shield label="2" size="3.5rem" />
                <div>
                  <h3 className={s.stepTitle}>{t("landing.step2Title")}</h3>
                  <p className={s.stepText}>{t("landing.step2Text")}</p>
                </div>
              </li>
              <li className={s.step}>
                <Monogram label="3" size="3.5rem" />
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
        </div>
      </footer>
    </>
  );
}
