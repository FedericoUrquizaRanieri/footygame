import { errorResponse, guard, json, parseId } from "@/server/http";
import { getPlayerStep } from "@/server/queries";
import { nodesLimiter } from "@/server/rate-limit";

const CACHE = "public, s-maxage=86400, stale-while-revalidate=604800";

/** Siguiente paso desde un jugador: sus club-temporadas. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const blocked = guard(request, nodesLimiter, "nodes");
  if (blocked) return blocked;

  const id = parseId((await params).id);
  if (id === null) return errorResponse(400, "invalid_id");

  const step = await getPlayerStep(id);
  if (!step) return errorResponse(404, "not_found");
  return json(step, 200, CACHE);
}
