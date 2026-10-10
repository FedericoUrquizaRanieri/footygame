import { challengeDateFor, secondsUntilNextChallengeDay } from "@/domain/daily-date";
import { errorResponse, guard, json } from "@/server/http";
import { challengeLimiter } from "@/server/rate-limit";
import { getChallengeForDate } from "@/server/queries";

/** Desafío del día: solo origen y destino. La solución nunca sale de acá. */
export async function GET(request: Request): Promise<Response> {
  const blocked = guard(request, challengeLimiter, "challenge");
  if (blocked) return blocked;

  const now = new Date();
  const challenge = await getChallengeForDate(challengeDateFor(now));
  if (!challenge) return errorResponse(404, "no_challenge");

  const ttl = Math.min(secondsUntilNextChallengeDay(now), 300);
  return json(challenge, 200, `public, s-maxage=${ttl}, stale-while-revalidate=60`);
}
