import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

async function runMigrations() {
  console.log("==========================================");
  console.log("ReceiptParser.io Database Migration Tool");
  console.log("==========================================");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is not defined.");
    process.exit(1);
  }

  // Look for schema.sql relative to current working directory or file
  const candidatePaths = [
    path.resolve(process.cwd(), "src/db/schema.sql"),
    path.resolve(process.cwd(), "dist/db/schema.sql"),
    path.resolve(process.cwd(), "api/src/db/schema.sql")
  ];

  let schemaPath = candidatePaths.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    console.error(`ERROR: Schema file not found. Checked: ${candidatePaths.join(", ")}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, "utf8");
  console.log(`Loaded schema file from: ${schemaPath} (${sql.length} bytes)`);

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting to PostgreSQL / Supabase database...");
    const client = await pool.connect();
    console.log("Connection established successfully.");

    console.log("Executing schema DDL migrations...");
    await client.query(sql);
    console.log("Schema DDL applied successfully.");

    // Verify created tables
    const tableRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\nVerified Public Tables:");
    tableRes.rows.forEach((row: any) => {
      console.log(` - ${row.table_name}`);
    });

    client.release();
    await pool.end();
    console.log("\nMigration completed successfully with 0 errors.");
  } catch (err: any) {
    console.error("\nFATAL MIGRATION ERROR:", err.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
