import { getPool } from "./db";

export interface FeedbackInput {
  kind: "feedback" | "removal";
  message: string;
  contact: string | null;
  locale: "es" | "en";
}

/** Guarda un mensaje. El rol de la app solo tiene INSERT en esta tabla (migración 005). */
export async function saveFeedback(input: FeedbackInput): Promise<void> {
  await getPool().query(
    "insert into feedback_messages (kind, message, contact, locale) values ($1, $2, $3, $4)",
    [input.kind, input.message, input.contact, input.locale],
  );
}
