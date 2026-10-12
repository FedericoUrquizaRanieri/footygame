import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { hasLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createT } from "@/i18n/translate";
import credits from "@/lib/player-photo-credits.generated.json";
import { getPlayerNames } from "@/server/queries";
import s from "@/components/game/game.module.css";

type Credit = { author: string; license: string; source: string };

const PAGE_SIZE = 200;

async function PhotoCredits({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: PageProps<"/[locale]/credits">["searchParams"];
}) {
  await connection();
  const t = createT(getMessages(locale));
  const entries = Object.entries(credits as Record<string, Credit>);
  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const raw = Number((await searchParams).page);
  const page = Number.isInteger(raw) ? Math.min(Math.max(raw, 1), pages) : 1;

  // Los créditos no cambian entre pedidos: se ordenan por id y solo se pide el nombre de la página actual.
  const slice = entries
    .sort(([a], [b]) => Number(a) - Number(b))
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const names = await getPlayerNames(slice.map(([id]) => Number(id))).catch(
    () => new Map<number, string>(),
  );
  const href = (p: number) => `/${locale}/credits?page=${p}`;
  return (
    <>
      <ul className={s.credits}>
        {slice.map(([id, c]) => (
          <li key={id}>
            <strong>{names.get(Number(id)) ?? id}</strong>: {t("credits.by", { author: c.author })}{" "}
            ·{" "}
            <a href={c.source} rel="noreferrer noopener" target="_blank">
              {c.license}
            </a>
          </li>
        ))}
      </ul>
      <nav className={s.creditsNav} aria-label={t("credits.pages")}>
        {page > 1 && <Link href={href(page - 1)}>{t("credits.prev")}</Link>}
        <span>
          {page} / {pages}
        </span>
        {page < pages && <Link href={href(page + 1)}>{t("credits.next")}</Link>}
      </nav>
    </>
  );
}

export default async function CreditsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/credits">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const t = createT(getMessages(locale));
  return (
    <>
      <SiteHeader locale={locale} />
      <main id="main" className="container">
        <h1>{t("credits.title")}</h1>
        <p>{t("credits.crests")}</p>
        <p>{t("credits.photos")}</p>
        <Suspense fallback={null}>
          <PhotoCredits locale={locale} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
