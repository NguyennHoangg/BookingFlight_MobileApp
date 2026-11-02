import { readFile } from "node:fs/promises";
import { connectPool } from "../src/config/db.config";

const client = await connectPool();
try {
  const sql = await readFile(new URL("../prisma/maintenance/booking.sql", import.meta.url), "utf8");
  await client.query(sql);
  console.log("Booking schema applied successfully (additive changes only).");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Booking schema could not be applied:", (error as { code?: string }).code || "connection/query error");
  process.exitCode = 1;
} finally { client.release(); }
process.exit(process.exitCode ?? 0);
