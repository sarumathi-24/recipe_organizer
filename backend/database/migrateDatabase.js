const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const createTablesSql = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL,
  instruction TEXT NOT NULL,
  cooking_time INTEGER NOT NULL,
  category VARCHAR(80),
  image_url TEXT,
  image_data BYTEA,
  image_mime_type VARCHAR(120),
  image_file_name VARCHAR(255),
  image_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_data BYTEA;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(120);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_file_name VARCHAR(255);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_size INTEGER;

CREATE INDEX IF NOT EXISTS recipes_user_id_idx ON recipes(user_id);

CREATE TABLE IF NOT EXISTS saved_recipes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS saved_recipes_user_id_idx ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS saved_recipes_recipe_id_idx ON saved_recipes(recipe_id);
`;

async function seedAdminUser(pool) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!adminEmail || !adminPassword) {
    console.log("Admin seed skipped. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one admin.");
    return;
  }

  if (adminPassword.length < 6) {
    throw new Error("ADMIN_PASSWORD must be at least 6 characters.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    "UPDATE users SET is_admin = false WHERE LOWER(email) <> $1 AND is_admin = true",
    [adminEmail]
  );

  const existingAdmin = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = $1",
    [adminEmail]
  );

  if (existingAdmin.rows.length > 0) {
    await pool.query(
      "UPDATE users SET name = $1, password_hash = $2, is_admin = true WHERE LOWER(email) = $3",
      [adminName, passwordHash, adminEmail]
    );
    console.log(`Admin user updated: ${adminEmail}`);
    return;
  }

  await pool.query(
    "INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, true)",
    [adminName, adminEmail, passwordHash]
  );
  console.log(`Admin user created: ${adminEmail}`);
}

async function migrateDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(createTablesSql);
  await seedAdminUser(pool);
  await pool.end();

  console.log("Database tables are ready.");
}

migrateDatabase().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
