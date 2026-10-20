import { challengeDateFor, secondsUntilNextChallengeDay } from "@/domain/daily-date";
import { errorResponse, guard, json } from "@/server/http";
import { challengeLimiter } from "@/server/rate-limit";
import { getChallengesForDate } from "@/server/queries";

/** Desafíos del día (normal y difícil): solo origen y destino. La solución nunca sale de acá. */
export async function GET(request: Request): Promise<Response> {
  const blocked = guard(request, challengeLimiter, "challenge");
  if (blocked) return blocked;

  const now = new Date();
  const date = challengeDateFor(now);
  const challenges = await getChallengesForDate(date);
  if (challenges.length === 0) return errorResponse(404, "no_challenge");

  const ttl = Math.min(secondsUntilNextChallengeDay(now), 300);
  return json(
    {
      date,
      normal: challenges.find((c) => c.difficulty === "normal") ?? null,
      hard: challenges.find((c) => c.difficulty === "hard") ?? null,
    },
    200,
    `public, s-maxage=${ttl}, stale-while-revalidate=60`,
  );
}
