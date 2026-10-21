import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/ui/FeedbackForm";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";

const SECTIONS = ["purpose", "crests", "photos", "data", "removal"] as const;

export default async function LegalPage({ params }: PageProps<"/[locale]/legal">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = createT(getMessages(locale));
  return (
    <PageStage zone="corner" calm>
      <SiteHeader locale={locale} />
      <main id="main" className="container">
        <h1>{t("legal.title")}</h1>
        {SECTIONS.map((key) => (
          <section key={key}>
            <h2>{t(`legal.${key}Title`)}</h2>
            <p>{t(`legal.${key}Text`)}</p>
          </section>
        ))}
        <section>
          <h2>{t("form.removalTitle")}</h2>
          <p>{t("form.removalIntro")}</p>
          <FeedbackForm kind="removal" />
        </section>
        <p>
          <Link href={`/${locale}/credits`}>{t("credits.title")}</Link>
        </p>
      </main>
    </PageStage>
  );
}
