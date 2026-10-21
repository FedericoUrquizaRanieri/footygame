import { afterAll, describe, expect, it } from "vitest";
import { POST as feedback } from "@/app/api/feedback/route";
import { closePool } from "@/server/db";
import { hasDb, request, uniqueIp, withClient } from "../helpers/db";

afterAll(closePool);

const post = (body: unknown, ip = uniqueIp()) =>
  feedback(
    request("/api/feedback", {
      method: "POST",
      headers: { "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("POST /api/feedback: validación (no toca la base)", () => {
  it.each([
    ["JSON inválido", "no-json"],
    ["sin tipo", { message: "hola", locale: "es" }],
    ["mensaje vacío", { kind: "feedback", message: "   ", locale: "es" }],
    ["feedback demasiado largo", { kind: "feedback", message: "a".repeat(501), locale: "es" }],
    ["retiro sin mail", { kind: "removal", message: "sacá la foto", locale: "es" }],
    ["retiro con mail inválido", { kind: "removal", message: "x", contact: "nope", locale: "es" }],
    ["idioma inválido", { kind: "feedback", message: "hola", locale: "fr" }],
  ])("%s -> 400", async (_name, body) => {
    expect((await post(body)).status).toBe(400);
  });

  it("un pedido demasiado grande -> 413", async () => {
    expect((await post("x".repeat(13_000))).status).toBe(413);
  });

  it("el campo trampa completado devuelve 201 sin guardar nada", async () => {
    const res = await post({
      kind: "feedback",
      message: "spam",
      locale: "es",
      website: "http://x",
    });
    expect(res.status).toBe(201);
  });

  it("limita a 5 mensajes cada 10 minutos por IP", async () => {
    const ip = uniqueIp();
    let last = 0;
    for (let i = 0; i < 6; i++) last = (await post("no-json", ip)).status;
    expect(last).toBe(429);
  });
});

describe.skipIf(!hasDb)("POST /api/feedback: guardado", () => {
  it("guarda el feedback y el pedido de retiro", async () => {
    expect((await post({ kind: "feedback", message: "Muy bueno", locale: "es" })).status).toBe(201);
    expect(
      (
        await post({
          kind: "removal",
          message: "Quiten mi foto",
          contact: "alguien@example.com",
          locale: "en",
        })
      ).status,
    ).toBe(201);
    const rows = await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
      const res = await c.query(
        "select kind, message, contact, locale from feedback_messages order by id",
      );
      return res.rows;
    });
    expect(rows).toContainEqual({
      kind: "feedback",
      message: "Muy bueno",
      contact: null,
      locale: "es",
    });
    expect(rows).toContainEqual({
      kind: "removal",
      message: "Quiten mi foto",
      contact: "alguien@example.com",
      locale: "en",
    });
  });
});
