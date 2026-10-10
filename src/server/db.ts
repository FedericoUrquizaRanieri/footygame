import pg from "pg";

// bigint (int8) y count(*) llegan como string por defecto; los ids de esta app caben en un number.
pg.types.setTypeParser(20, (value) => Number(value));

let pool: pg.Pool | undefined;

/** Pool de conexiones con el rol de SOLO LECTURA de la app (DATABASE_URL). Solo se usa en el servidor. */
export function getPool(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL no está configurada");
    pool = new pg.Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30_000 });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
