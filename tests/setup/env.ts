import { loadEnvLocal } from "../../scripts/db/env";

// Los tests de integración usan SIEMPRE la base de test, nunca la de desarrollo.
loadEnvLocal();
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
} else {
  delete process.env.DATABASE_URL;
}
