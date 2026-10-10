import type { Messages } from "./messages";

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

/** Traductor simple: claves con puntos ("landing.title") y variables {nombre}. */
export function createT(messages: Messages): TFunction {
  return (key, vars) => {
    let node: unknown = messages;
    for (const part of key.split(".")) {
      node =
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined;
    }
    if (typeof node !== "string") return key;
    return vars
      ? node.replace(/\{(\w+)\}/g, (match, name: string) => String(vars[name] ?? match))
      : node;
  };
}
