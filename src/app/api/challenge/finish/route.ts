import { z } from "zod";
import { compareToOptimal } from "@/domain/challenge";
import { challengeDateFor } from "@/domain/daily-date";
import { MAX_JUMPS, type NodeRef } from "@/domain/types";
import { validatePath } from "@/domain/validate-path";
import { errorResponse, guard, json } from "@/server/http";
import { getChallengeWithSolution, getOptimalPathsLabeled, getPathGraph } from "@/server/queries";
import { finishLimiter } from "@/server/rate-limit";

const nodeSchema = z.object({
  type: z.enum(["player", "club-season"]),
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});

const bodySchema = z.object({
  challengeId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  path: z
    .array(nodeSchema)
    .min(1)
    .max(MAX_JUMPS + 1),
  elapsedMs: z
    .number()
    .finite()
    .min(0)
    .max(2 * 86_400_000),
  /** La persona se rindió: se acepta un camino que no llegó al destino. */
  gaveUp: z.boolean().optional(),
});

const MAX_BODY_BYTES = 8_000;

/**
 * Cierra un intento: valida el camino contra el grafo y, solo si es válido, devuelve el resumen
 * con el camino óptimo. Es la única ruta que entrega la solución.
 */
export async function POST(request: Request): Promise<Response> {
  const blocked = guard(request, finishLimiter, "finish");
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
  if (!body.success) return errorResponse(400, "invalid_body");
  const { challengeId, elapsedMs } = body.data;
  const path: NodeRef[] = body.data.path;

  const found = await getChallengeWithSolution(challengeId);
  // Un desafío futuro no existe todavía para el público: no se puede adelantar la solución.
  if (!found || found.challenge.date > challengeDateFor(new Date())) {
    return errorResponse(404, "not_found");
  }

  const graph = await getPathGraph(path);
  const verdict = validatePath(graph, found.challenge, path, elapsedMs, {
    gaveUp: body.data.gaveUp,
  });
  if (!verdict.valid) return json({ valid: false, reason: verdict.reason }, 422);

  const comparison = compareToOptimal(verdict.jumps, found.optimalLength);
  return json({
    valid: true,
    result: verdict.result,
    jumps: verdict.jumps,
    elapsedMs,
    optimal: {
      length: found.optimalLength,
      pathsCount: found.optimalPathsCount,
      paths: await getOptimalPathsLabeled(challengeId),
    },
    extraJumps: comparison.extraJumps,
    isOptimal: comparison.isOptimal,
    difficulty: found.difficulty,
    ...(verdict.gaveUp ? { gaveUp: true } : {}),
  });
}
