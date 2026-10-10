/** Minúsculas, sin acentos, espacios colapsados. */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Filtra por nombre: todas las palabras de la consulta deben aparecer, en cualquier orden. */
export function filterByName<T extends { name: string }>(items: readonly T[], query: string): T[] {
  const normalized = normalizeText(query);
  if (normalized === "") return [...items];
  const tokens = normalized.split(" ");
  return items.filter((item) => {
    const name = normalizeText(item.name);
    return tokens.every((token) => name.includes(token));
  });
}
