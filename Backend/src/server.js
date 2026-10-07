const { Pool } = require("pg");
const { createApp } = require("./app");
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
});
(async () => {
  await pool.query("SELECT 1");
  const server = createApp(pool).listen(
    process.env.PORT || 3000,
    "0.0.0.0",
    () =>
      console.log("PetShop listening on port " + (process.env.PORT || 3000)),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () =>
      server.close(async () => {
        await pool.end();
        process.exit(0);
      }),
    );
})().catch((e) => {
  console.error("Database startup failed:", e.message);
  process.exit(1);
});
