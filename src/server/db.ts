import pg from "pg";

// bigint (int8) y count(*) llegan como string por defecto; los ids de esta app caben en un number.
pg.types.setTypeParser(20, (value) => Number(value));

let pool: pg.Pool | undefined;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Configuración del pool según el entorno. En Vercel cada instancia serverless abre su propio pool, así que
 * se usan pocas conexiones para no agotar el pooler de Supabase. Fuera de localhost la conexión va con SSL
 * (el pooler de Supabase presenta un certificado propio, por eso no se verifica la cadena).
 */
export function poolConfig(
  url: string,
  env: Record<string, string | undefined> = process.env,
): pg.PoolConfig {
  const local = LOCAL_HOSTS.has(new URL(url).hostname);
  return {
    connectionString: url,
    max: env.VERCEL ? 3 : 10,
    idleTimeoutMillis: 30_000,
    ...(local ? {} : { ssl: { rejectUnauthorized: false } }),
  };
}

/** Pool de conexiones con el rol de SOLO LECTURA de la app (DATABASE_URL). Solo se usa en el servidor. */
export function getPool(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL no está configurada");
    pool = new pg.Pool(poolConfig(url));
  }
  return pool;
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
