import type { Locale } from "../config";
import en from "./en.json";
import es from "./es.json";

export type Messages = typeof es;

const all: Record<Locale, Messages> = { es, en };

export const getMessages = (locale: Locale): Messages => all[locale];
