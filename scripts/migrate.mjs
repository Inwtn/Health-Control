import { readFile, readdir } from "node:fs/promises";
import { createHash, X509Certificate } from "node:crypto";
import { rootCertificates } from "node:tls";
import pg from "pg";

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connectionString) {
  if (process.env.VITE_SUPABASE_URL) {
    console.error(
      "Database migration requires the server-side Postgres binding.",
    );
    process.exit(1);
  }
  console.log("No Supabase configured; building local mode.");
} else {
  // Remove URL TLS overrides: certificate and hostname validation stay enabled.
  const url = new URL(connectionString);
  for (const option of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(option);
  // Official Supabase CA, published by the provider's dashboard source:
  // https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json
  // Keep HTTPS verification for the download AND certificate/hostname verification for Postgres.
  const caResponse = await fetch(
    "https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt",
    { signal: AbortSignal.timeout(15000) },
  );
  if (!caResponse.ok) throw new Error("supabase_ca_download_failed");
  const ca = await caResponse.text();
  const certificate = new X509Certificate(ca);
  if (!certificate.ca || Date.parse(certificate.validTo) <= Date.now())
    throw new Error("supabase_ca_invalid");
  if (
    certificate.fingerprint256 !==
    "80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA"
  )
    throw new Error("supabase_ca_fingerprint_mismatch");
  console.log("Official Supabase CA verified.");
  const client = new pg.Client({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ca: [...rootCertificates, ca] },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(726854112)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS public.health_schema_migrations (name text primary key, checksum text not null, applied_at timestamptz not null default now())",
    );
    await client.query(
      "REVOKE ALL ON public.health_schema_migrations FROM anon, authenticated",
    );
    for (const name of (
      await readdir(new URL("../supabase/migrations/", import.meta.url))
    )
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(
        new URL("../supabase/migrations/" + name, import.meta.url),
        "utf8",
      );
      const checksum = createHash("sha256").update(sql).digest("hex");
      const { rows } = await client.query(
        "SELECT checksum FROM public.health_schema_migrations WHERE name=$1",
        [name],
      );
      if (rows.length) {
        if (rows[0].checksum !== checksum)
          throw new Error("migration_checksum_mismatch");
        continue;
      }
      await client.query(
        sql.replace(/^begin;\s*$/im, "").replace(/^commit;\s*$/im, ""),
      );
      await client.query(
        "INSERT INTO public.health_schema_migrations(name, checksum) VALUES ($1,$2)",
        [name, checksum],
      );
      console.log("Applied migration:", name);
    }
    await client.query("COMMIT");
    if (process.env.HC_VALIDATE_AUTH === "1") {
      await client.query(
        await readFile(
          new URL("../supabase/checks/ownership.sql", import.meta.url),
          "utf8",
        ),
      );
      console.log(
        "Real database ownership, anonymous access and revision checks passed (fixtures rolled back).",
      );
      const { validateAuth } = await import("./validate-auth.mjs");
      await validateAuth();
    }
    console.log("Database migrations ready.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    // Database diagnostics may contain credentials or records. Only print a code.
    console.error(
      "Database setup failed:",
      error.code ||
        (error.message === "migration_checksum_mismatch"
          ? error.message
          : error.name),
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
