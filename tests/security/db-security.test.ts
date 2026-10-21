import { describe, expect, it } from "vitest";
import { hasDb, withClient } from "../helpers/db";

const TABLES = [
  "players",
  "clubs",
  "club_seasons",
  "player_club_seasons",
  "challenges",
  "feedback_messages",
];
const PRIVILEGES = ["SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"];

describe.skipIf(!hasDb)("S-01/S-02 la base está cerrada a la API pública", () => {
  it("RLS está activado en todas las tablas del esquema public", async () => {
    const rows = await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
      const res = await c.query(
        `select c.relname, c.relrowsecurity
           from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r' and c.relname <> 'schema_migrations'`,
      );
      return res.rows;
    });
    expect(rows.map((r) => r.relname).sort()).toEqual([...TABLES].sort());
    for (const r of rows) expect(r.relrowsecurity, `RLS en ${r.relname}`).toBe(true);
  });

  it.each(["anon", "authenticated"])(
    "el rol %s no tiene ningún permiso sobre ninguna tabla",
    async (role) => {
      await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
        for (const t of [...TABLES, "schema_migrations"]) {
          for (const priv of PRIVILEGES) {
            const { rows } = await c.query("select has_table_privilege($1, $2, $3) as ok", [
              role,
              `public.${t}`,
              priv,
            ]);
            expect(rows[0].ok, `${role} ${priv} ${t}`).toBe(false);
          }
        }
      });
    },
  );

  it("PUBLIC tampoco tiene permisos de tabla", async () => {
    const rows = await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
      const res = await c.query(
        `select table_name, privilege_type from information_schema.role_table_grants
          where table_schema = 'public' and grantee = 'PUBLIC'`,
      );
      return res.rows;
    });
    expect(rows).toEqual([]);
  });

  it("ninguna política RLS aplica a anon, authenticated ni PUBLIC", async () => {
    const rows = await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
      const res = await c.query(
        "select tablename, policyname, roles::text from pg_policies where schemaname = 'public'",
      );
      return res.rows;
    });
    expect(rows.length).toBe(TABLES.length);
    for (const r of rows) {
      expect(r.roles, `política ${r.policyname} en ${r.tablename}`).toBe("{footygame_app}");
    }
  });

  it("el rol de la app puede leer pero no escribir ni alterar el esquema", async () => {
    await withClient("TEST_DATABASE_URL", async (c) => {
      const count = Number((await c.query("select count(*) n from players")).rows[0].n);
      expect(count).toBeGreaterThan(0);
      for (const sql of [
        "insert into players (id, name, name_search) values (999999, 'x', 'x')",
        "update players set name = 'hack'",
        "delete from players",
        "truncate players",
        "drop table players",
        "create table hack (id int)",
        "update challenges set optimal_length = 0",
      ]) {
        await expect(c.query(sql), sql).rejects.toMatchObject({ code: "42501" });
      }
    });
  });

  it("el rol de la app solo puede INSERTAR en feedback_messages (sin leer, editar ni borrar)", async () => {
    await withClient("TEST_DATABASE_URL", async (c) => {
      await c.query(
        "insert into feedback_messages (kind, message, contact, locale) values ('feedback', 'hola', null, 'es')",
      );
      for (const sql of [
        "select * from feedback_messages",
        "update feedback_messages set message = 'x'",
        "delete from feedback_messages",
        "truncate feedback_messages",
      ]) {
        await expect(c.query(sql), sql).rejects.toMatchObject({ code: "42501" });
      }
      // Un pedido de retiro sin mail de contacto no se acepta.
      await expect(
        c.query(
          "insert into feedback_messages (kind, message, contact, locale) values ('removal', 'x', null, 'es')",
        ),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("el rol de la app no puede leer la tabla de migraciones", async () => {
    await withClient("TEST_DATABASE_URL", async (c) => {
      await expect(c.query("select * from schema_migrations")).rejects.toMatchObject({
        code: "42501",
      });
    });
  });

  it("el rol de la app no es superusuario ni puede saltarse RLS", async () => {
    await withClient("TEST_DATABASE_URL", async (c) => {
      const { rows } = await c.query(
        "select rolsuper, rolbypassrls, rolcreatedb, rolcreaterole from pg_roles where rolname = current_user",
      );
      expect(rows[0]).toEqual({
        rolsuper: false,
        rolbypassrls: false,
        rolcreatedb: false,
        rolcreaterole: false,
      });
    });
  });
});
