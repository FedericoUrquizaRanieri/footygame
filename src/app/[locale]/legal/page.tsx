import Link from "next/link";
import { notFound } from "next/navigation";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";

/** Mail para pedidos de retiro. Se configura con CONTACT_EMAIL; si falta, no se muestra. */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;

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
        {CONTACT_EMAIL && (
          <p>
            {t("legal.contact")} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        )}
        <p>
          <Link href={`/${locale}/credits`}>{t("credits.title")}</Link>
        </p>
      </main>
    </PageStage>
  );
}
