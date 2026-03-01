import pkg from "pg";
const { Client } = pkg;

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Running database migration...");

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS voucher_cards (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      serial TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      purchaser_phone TEXT,
      purchaser_email TEXT,
      exam_type TEXT,
      price INTEGER NOT NULL DEFAULT 20,
      image_url TEXT,
      used_at TIMESTAMP
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT,
      phone TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      paystack_reference TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      voucher_card_id UUID REFERENCES voucher_cards(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP
    )
  `);

  console.log("Database migration completed successfully!");
  await client.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
