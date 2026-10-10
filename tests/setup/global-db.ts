import { loadEnvLocal } from "../../scripts/db/env";
import { migrate } from "../../scripts/db/migrate";
import { seedTestDb } from "../fixtures/db-seed";

/** Si hay base de test configurada: recrea el esquema, aplica las migraciones y carga el grafo mínimo. */
export default async function setup(): Promise<void> {
  loadEnvLocal();
  const admin = process.env.TEST_DATABASE_URL_ADMIN;
  if (!admin || !process.env.TEST_DATABASE_URL) return;
  await migrate(admin, true);
  await seedTestDb(admin);
}
