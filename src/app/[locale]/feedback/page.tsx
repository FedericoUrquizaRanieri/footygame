import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/ui/FeedbackForm";
import { PageStage } from "@/components/ui/PageStage";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";

export default async function FeedbackPage({ params }: PageProps<"/[locale]/feedback">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = createT(getMessages(locale));
  return (
    <PageStage zone="corner" calm>
      <SiteHeader locale={locale} />
      <main id="main" className="container">
        <h1>{t("form.feedbackTitle")}</h1>
        <p>{t("form.feedbackIntro")}</p>
        <FeedbackForm kind="feedback" />
      </main>
    </PageStage>
  );
}
