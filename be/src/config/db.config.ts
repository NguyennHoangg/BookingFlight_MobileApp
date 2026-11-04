import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

// Tao connection pool de quan li ket noi voi database
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
  : new pg.Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME || "postgres",
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT) || 5432,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

// pg removes broken idle clients automatically; handle the event so it cannot
// become an uncaught exception and terminate the API process.
pool.on("error", (error) => {
  console.error("Unexpected idle database connection error:", error);
});

// thuc thi query
// Opt in only for standalone, read-only statements. A failed write may have
// committed before the socket reset, so replaying it could duplicate changes.
const query = async (
  text: string,
  params?: any[],
  options: { retryOnConnectionReset?: boolean } = {},
) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      if (
        attempt === 0 &&
        options.retryOnConnectionReset &&
        (error as NodeJS.ErrnoException).code === "ECONNRESET"
      ) {
        // pool.query discards the failed client; the next checkout can reconnect.
        continue;
      }
      console.error("Error executing query:", error);
      throw error;
    }
  }
};

// ket noi den database
const connectPool = () => {
  return pool.connect();
};

// thuc thi transaction query
const transactionQuery = async (queries: string[]) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const results = [];
    for (const query of queries) {
      const result = await client.query(query);
      results.push(result);
    }
    await client.query("COMMIT");
    return results;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export { query, transactionQuery, connectPool };
