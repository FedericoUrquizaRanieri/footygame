import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function load() {
  vi.resetModules();
  const [{ playerPhotoSrc }, { PLAYER_PHOTO_IDS }] = await Promise.all([
    import("@/lib/player-photos"),
    import("@/lib/player-photos.generated"),
  ]);
  return { playerPhotoSrc, id: PLAYER_PHOTO_IDS[0] };
}

describe("playerPhotoSrc", () => {
  it("sin variable, sirve desde public/players", async () => {
    vi.stubEnv("NEXT_PUBLIC_PHOTOS_BASE_URL", "");
    delete process.env.NEXT_PUBLIC_PHOTOS_BASE_URL;
    const { playerPhotoSrc, id } = await load();
    expect(playerPhotoSrc(id)).toBe(`/players/${id}.jpg`);
  });

  it("con la variable, usa Supabase Storage (sin barra final doble)", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_PHOTOS_BASE_URL",
      "https://x.supabase.co/storage/v1/object/public/players/",
    );
    const { playerPhotoSrc, id } = await load();
    expect(playerPhotoSrc(id)).toBe(
      `https://x.supabase.co/storage/v1/object/public/players/${id}.jpg`,
    );
  });

  it("devuelve null si el jugador no tiene foto", async () => {
    const { playerPhotoSrc } = await load();
    expect(playerPhotoSrc(-1)).toBeNull();
  });
});
