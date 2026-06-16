/**
 * One-time baseline for databases that were created with `db:push`
 * instead of `db:migrate`. Marks prior migrations as applied, then
 * runs any pending SQL (e.g. auth_tokens / email_verified_at).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

const migrationsFolder = "db/migrations";
const journal = JSON.parse(
  readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8"),
) as {
  entries: { tag: string; when: number }[];
};

function migrationMeta(tag: string, when: number) {
  const sql = readFileSync(`${migrationsFolder}/${tag}.sql`, "utf8");
  const hash = createHash("sha256").update(sql).digest("hex");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  return { tag, when, hash, statements };
}

const migrations = journal.entries.map((entry) =>
  migrationMeta(entry.tag, entry.when),
);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sql = neon(url);

  const [{ exists: usersExists }] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS exists
  `;

  const applied = await sql`
    SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at
  `;
  const appliedHashes = new Set(applied.map((row) => row.hash));

  if (!usersExists) {
    console.log(
      "No existing schema detected. Run `pnpm db:migrate` for a fresh database.",
    );
    process.exit(1);
  }

  if (applied.length > 0) {
    console.log("Migration history already exists. Run `pnpm db:migrate` instead.");
    process.exit(0);
  }

  console.log("Baselining pushed schema and applying pending migrations...");

  for (const migration of migrations.slice(0, -1)) {
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${migration.hash}, ${migration.when})
    `;
    console.log(`Marked applied: ${migration.tag}`);
  }

  const latest = migrations[migrations.length - 1];
  if (!appliedHashes.has(latest.hash)) {
    for (const statement of latest.statements) {
      await sql.query(statement);
    }
    await sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES (${latest.hash}, ${latest.when})
    `;
    console.log(`Applied: ${latest.tag}`);
  }

  console.log("Baseline complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
