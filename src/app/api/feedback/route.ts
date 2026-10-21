import { z } from "zod";
import { FEEDBACK_MAX, REMOVAL_MAX } from "@/lib/feedback-limits";
import { errorResponse, guard, json } from "@/server/http";
import { saveFeedback } from "@/server/feedback";
import { feedbackLimiter } from "@/server/rate-limit";

const MAX_BODY_BYTES = 12_000;

const email = z.string().trim().max(254).email();

const bodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("feedback"),
    message: z.string().trim().min(1).max(FEEDBACK_MAX),
    contact: z.union([email, z.literal("")]).optional(),
    locale: z.enum(["es", "en"]),
    /** Campo trampa: las personas no lo ven ni lo completan; los bots sí. */
    website: z.string().max(0).optional(),
  }),
  z.object({
    kind: z.literal("removal"),
    message: z.string().trim().min(1).max(REMOVAL_MAX),
    contact: email,
    locale: z.enum(["es", "en"]),
    website: z.string().max(0).optional(),
  }),
]);

/** Recibe el feedback y los pedidos de retiro de contenido. */
export async function POST(request: Request): Promise<Response> {
  const blocked = guard(request, feedbackLimiter, "feedback");
  if (blocked) return blocked;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return errorResponse(413, "payload_too_large");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return errorResponse(400, "invalid_json");
  }
  const body = bodySchema.safeParse(parsedJson);
  if (!body.success) {
    // Un bot que completó el campo trampa recibe "ok" sin que se guarde nada.
    const honeypot =
      typeof parsedJson === "object" &&
      parsedJson !== null &&
      "website" in parsedJson &&
      Boolean((parsedJson as { website?: unknown }).website);
    return honeypot ? json({ ok: true }, 201) : errorResponse(400, "invalid_body");
  }

  await saveFeedback({
    kind: body.data.kind,
    message: body.data.message,
    contact: body.data.contact ? body.data.contact : null,
    locale: body.data.locale,
  });
  return json({ ok: true }, 201);
}
