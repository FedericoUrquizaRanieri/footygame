import type { Metadata } from "next";
import { Big_Shoulders, Hanken_Grotesk } from "next/font/google";
import { defaultLocale, hasLocale, locales } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { I18nProvider } from "@/i18n/provider";
import { createT } from "@/i18n/translate";
import "../globals.css";

const display = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--font-display-src",
  display: "swap",
  adjustFontFallback: false,
});

const ui = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-ui-src",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = createT(getMessages(locale));
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale: requested } = await params;
  // Un idioma inválido lo resuelve cada página con notFound(); acá solo se evita romper el layout.
  const locale = hasLocale(requested) ? requested : defaultLocale;
  const messages = getMessages(locale);
  const t = createT(messages);

  return (
    <html lang={locale} className={`${display.variable} ${ui.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          {t("nav.skip")}
        </a>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
