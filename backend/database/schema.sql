CREATE DATABASE recipe_organizer;

-- Run the lines below after connecting to recipe_organizer.

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

CREATE TABLE IF NOT EXISTS recipe_images (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  image_data BYTEA NOT NULL,
  mime_type VARCHAR(120),
  file_name VARCHAR(255),
  size INTEGER,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS recipe_images_recipe_id_idx ON recipe_images(recipe_id);

CREATE TABLE IF NOT EXISTS saved_recipes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS saved_recipes_user_id_idx ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS saved_recipes_recipe_id_idx ON saved_recipes(recipe_id);
