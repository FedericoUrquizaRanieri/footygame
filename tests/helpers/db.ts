import pg from "pg";

/** Hay base de test configurada (local: .env.local; CI: variables de entorno). */
export const hasDb = Boolean(process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL_ADMIN);

let counter = 0;
/** IP distinta por pedido para que el rate limit en memoria no interfiera entre tests. */
export const uniqueIp = (): string => `10.0.${Math.floor(++counter / 250)}.${counter % 250}`;

export async function withClient<T>(
  envVar: "TEST_DATABASE_URL" | "TEST_DATABASE_URL_ADMIN",
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({ connectionString: process.env[envVar] });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export const request = (path: string, init: RequestInit = {}): Request =>
  new Request(`http://localhost${path}`, {
    ...init,
    headers: { "x-forwarded-for": uniqueIp(), ...(init.headers as Record<string, string>) },
  });
