import { describe, expect, it } from "vitest";
import { poolConfig } from "@/server/db";

const LOCAL = "postgresql://footygame_app:x@localhost:5433/footygame";
const SUPABASE =
  "postgresql://footygame_app.ref:x@aws-1-us-west-2.pooler.supabase.com:6543/postgres";

describe("poolConfig", () => {
  it("localhost: sin SSL y hasta 10 conexiones", () => {
    const cfg = poolConfig(LOCAL, {});
    expect(cfg.ssl).toBeUndefined();
    expect(cfg.max).toBe(10);
  });

  it("host remoto: con SSL", () => {
    expect(poolConfig(SUPABASE, {}).ssl).toEqual({ rejectUnauthorized: false });
  });

  it("en Vercel usa pocas conexiones por instancia", () => {
    expect(poolConfig(SUPABASE, { VERCEL: "1" }).max).toBe(3);
  });
});
