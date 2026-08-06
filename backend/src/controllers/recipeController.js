const pool = require("../config/db");

const ALLOWED_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Juices", "Dessert"];

const recipeFields = `
  recipes.id,
  recipes.user_id,
  recipes.title,
  recipes.description,
  recipes.ingredients,
  recipes.instruction,
  recipes.cooking_time,
  recipes.category,
  COALESCE(
    (SELECT CONCAT('/api/recipes/', recipes.id, '/images/', recipe_images.id)
     FROM recipe_images
     WHERE recipe_images.recipe_id = recipes.id
     ORDER BY recipe_images.position, recipe_images.id
     LIMIT 1),
    CASE
      WHEN recipes.image_data IS NOT NULL THEN CONCAT('/api/recipes/', recipes.id, '/image')
      ELSE recipes.image_url
    END
  ) AS image_url,
  COALESCE(
    (SELECT recipe_images.mime_type
     FROM recipe_images
     WHERE recipe_images.recipe_id = recipes.id
     ORDER BY recipe_images.position, recipe_images.id
     LIMIT 1),
    recipes.image_mime_type
  ) AS image_mime_type,
  COALESCE(
    (SELECT recipe_images.file_name
     FROM recipe_images
     WHERE recipe_images.recipe_id = recipes.id
     ORDER BY recipe_images.position, recipe_images.id
     LIMIT 1),
    recipes.image_file_name
  ) AS image_file_name,
  COALESCE(
    (SELECT recipe_images.size
     FROM recipe_images
     WHERE recipe_images.recipe_id = recipes.id
     ORDER BY recipe_images.position, recipe_images.id
     LIMIT 1),
    recipes.image_size
  ) AS image_size,
  COALESCE(
    (SELECT json_agg(
       json_build_object(
         'id', recipe_images.id,
         'url', CONCAT('/api/recipes/', recipes.id, '/images/', recipe_images.id),
         'mime_type', recipe_images.mime_type,
         'file_name', recipe_images.file_name,
         'size', recipe_images.size
       )
       ORDER BY recipe_images.position, recipe_images.id
     )
     FROM recipe_images
     WHERE recipe_images.recipe_id = recipes.id),
    '[]'::json
  ) AS images,
  recipes.created_at,
  recipes.updated_at
`;

function getUploadedFiles(req) {
  if (req.files && !Array.isArray(req.files)) {
    return [...(req.files.image || []), ...(req.files.images || [])];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.file) {
    return [req.file];
  }

  return [];
}

function getSafeHeaderFileName(fileName) {
  return (fileName || "recipe-file").replace(/["\r\n]/g, "");
}

async function saveRecipeFiles(client, recipeId, files) {
  if (files.length === 0) return;

  const positionResult = await client.query(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM recipe_images WHERE recipe_id = $1",
    [recipeId]
  );
  const nextPosition = Number(positionResult.rows[0].next_position);

  for (const [index, file] of files.entries()) {
    await client.query(
      `INSERT INTO recipe_images
       (recipe_id, image_data, mime_type, file_name, size, position)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [recipeId, file.buffer, file.mimetype, file.originalname, file.size, nextPosition + index]
    );
  }
}

function validateRecipe(data) {
  const { title, ingredients, instruction, cooking_time, category } = data;

  if (!title || !ingredients || !instruction || !cooking_time || !category) {
    return "Title, ingredients, instruction, cooking time, and category are required.";
  }

  const cookingTime = Number(cooking_time);

  if (!Number.isInteger(cookingTime) || cookingTime <= 0) {
    return "Cooking time must be a whole number greater than 0.";
  }

  if (cookingTime > 120) {
    return "Cooking time cannot be more than 120 minutes.";
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return "Category must be Breakfast, Lunch, Dinner, Snacks, Juices, or Dessert.";
  }

  return null;
}

async function getAllRecipes(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${recipeFields}, users.name AS author_name
       FROM recipes
       JOIN users ON users.id = recipes.user_id
       ORDER BY recipes.created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Could not load recipes." });
  }
}

async function getMyRecipes(req, res) {
  try {
    if (req.user.is_admin) {
      const adminResult = await pool.query(
        `SELECT ${recipeFields}, users.name AS author_name
         FROM recipes
         JOIN users ON users.id = recipes.user_id
         ORDER BY recipes.created_at DESC`
      );

      return res.json(adminResult.rows);
    }

    const result = await pool.query(
      `SELECT ${recipeFields}, users.name AS author_name
       FROM recipes
       JOIN users ON users.id = recipes.user_id
       WHERE recipes.user_id = $1
       ORDER BY recipes.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Could not load your recipes." });
  }
}

async function getSavedRecipeIds(req, res) {
  try {
    const result = await pool.query(
      "SELECT recipe_id FROM saved_recipes WHERE user_id = $1",
      [req.user.id]
    );

    return res.json(result.rows.map((row) => row.recipe_id));
  } catch (error) {
    return res.status(500).json({ message: "Could not load saved recipes." });
  }
}

async function getSavedRecipes(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${recipeFields}, users.name AS author_name, saved_recipes.created_at AS saved_at
       FROM saved_recipes
       JOIN recipes ON recipes.id = saved_recipes.recipe_id
       JOIN users ON users.id = recipes.user_id
       WHERE saved_recipes.user_id = $1
       ORDER BY saved_recipes.created_at DESC`,
      [req.user.id]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: "Could not load saved recipes." });
  }
}

async function getRecipeById(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${recipeFields}, users.name AS author_name
       FROM recipes
       JOIN users ON users.id = recipes.user_id
       WHERE recipes.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Could not load recipe." });
  }
}

async function getRecipeImage(req, res) {
  try {
    const result = await pool.query(
      `SELECT image_data, image_mime_type, image_file_name, image_size, image_url
       FROM recipes
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    const recipe = result.rows[0];

    if (!recipe.image_data) {
      return res.status(404).json({ message: "No database file found for this recipe." });
    }

    res.setHeader("Content-Type", recipe.image_mime_type || "application/octet-stream");
    res.setHeader("Content-Length", recipe.image_size);
    res.setHeader("Content-Disposition", `inline; filename="${getSafeHeaderFileName(recipe.image_file_name)}"`);

    return res.send(recipe.image_data);
  } catch (error) {
    return res.status(500).json({ message: "Could not load recipe file." });
  }
}

async function getRecipeGalleryImage(req, res) {
  try {
    const result = await pool.query(
      `SELECT image_data, mime_type, file_name, size
       FROM recipe_images
       WHERE recipe_id = $1 AND id = $2`,
      [req.params.id, req.params.imageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Recipe image not found." });
    }

    const image = result.rows[0];

    res.setHeader("Content-Type", image.mime_type || "application/octet-stream");
    res.setHeader("Content-Length", image.size);
    res.setHeader("Content-Disposition", `inline; filename="${getSafeHeaderFileName(image.file_name)}"`);

    return res.send(image.image_data);
  } catch (error) {
    return res.status(500).json({ message: "Could not load recipe image." });
  }
}

async function saveRecipe(req, res) {
  try {
    const recipe = await pool.query(
      "SELECT id FROM recipes WHERE id = $1",
      [req.params.id]
    );

    if (recipe.rows.length === 0) {
      return res.status(404).json({ message: "Recipe not found." });
    }

    await pool.query(
      `INSERT INTO saved_recipes (user_id, recipe_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, recipe_id) DO NOTHING`,
      [req.user.id, req.params.id]
    );

    return res.status(201).json({ message: "Recipe saved." });
  } catch (error) {
    return res.status(500).json({ message: "Could not save recipe." });
  }
}

async function unsaveRecipe(req, res) {
  try {
    await pool.query(
      "DELETE FROM saved_recipes WHERE user_id = $1 AND recipe_id = $2",
      [req.user.id, req.params.id]
    );

    return res.json({ message: "Recipe removed from saved." });
  } catch (error) {
    return res.status(500).json({ message: "Could not remove saved recipe." });
  }
}

async function createRecipe(req, res) {
  const errorMessage = validateRecipe(req.body);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const {
    title,
    description,
    ingredients,
    instruction,
    cooking_time,
    category,
  } = req.body;

  const uploadedFiles = getUploadedFiles(req);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO recipes
       (user_id, title, description, ingredients, instruction, cooking_time, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        req.user.id,
        title,
        description || "",
        ingredients,
        instruction,
        Number(cooking_time),
        category || ""
      ]
    );

    const recipeId = result.rows[0].id;
    await saveRecipeFiles(client, recipeId, uploadedFiles);

    const recipeResult = await client.query(
      `SELECT ${recipeFields}, users.name AS author_name
       FROM recipes
       JOIN users ON users.id = recipes.user_id
       WHERE recipes.id = $1`,
      [recipeId]
    );

    await client.query("COMMIT");

    return res.status(201).json(recipeResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Could not create recipe." });
  } finally {
    client.release();
  }
}

async function updateRecipe(req, res) {
  const errorMessage = validateRecipe(req.body);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const {
    title,
    description,
    ingredients,
    instruction,
    cooking_time,
    category,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentRecipe = await client.query(
      "SELECT id FROM recipes WHERE id = $1 AND (user_id = $2 OR $3 = true)",
      [req.params.id, req.user.id, Boolean(req.user.is_admin)]
    );

    if (currentRecipe.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Only the recipe owner or admin can edit this recipe." });
    }

    const uploadedFiles = getUploadedFiles(req);

    const result = await client.query(
      `UPDATE recipes
       SET title = $1,
           description = $2,
           ingredients = $3,
           instruction = $4,
           cooking_time = $5,
           category = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND (user_id = $8 OR $9 = true)
       RETURNING id`,
      [
        title,
        description || "",
        ingredients,
        instruction,
        Number(cooking_time),
        category || "",
        req.params.id,
        req.user.id,
        Boolean(req.user.is_admin)
      ]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Only the recipe owner or admin can edit this recipe." });
    }

    await saveRecipeFiles(client, req.params.id, uploadedFiles);

    const recipeResult = await client.query(
      `SELECT ${recipeFields}, users.name AS author_name
       FROM recipes
       JOIN users ON users.id = recipes.user_id
       WHERE recipes.id = $1`,
      [req.params.id]
    );

    await client.query("COMMIT");

    return res.json(recipeResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Could not update recipe." });
  } finally {
    client.release();
  }
}

async function deleteRecipe(req, res) {
  try {
    const result = await pool.query(
      "DELETE FROM recipes WHERE id = $1 AND (user_id = $2 OR $3 = true) RETURNING id",
      [req.params.id, req.user.id, Boolean(req.user.is_admin)]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Only the recipe owner or admin can delete this recipe." });
    }

    return res.json({ message: "Recipe deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Could not delete recipe." });
  }
}

module.exports = {
  getAllRecipes,
  getMyRecipes,
  getSavedRecipeIds,
  getSavedRecipes,
  getRecipeById,
  getRecipeImage,
  getRecipeGalleryImage,
  saveRecipe,
  unsaveRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe
};
