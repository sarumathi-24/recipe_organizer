const pool = require("../config/db");
const upload = require("../middleware/uploadMiddleware");

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
  CASE
    WHEN recipes.image_data IS NOT NULL THEN CONCAT('/api/recipes/', recipes.id, '/image')
    ELSE recipes.image_url
  END AS image_url,
  recipes.image_mime_type,
  recipes.image_file_name,
  recipes.image_size,
  recipes.created_at,
  recipes.updated_at
`;

function getUploadedFile(req) {
  if (!req.file) return null;

  return {
    data: req.file.buffer,
    mimeType: req.file.mimetype,
    fileName: req.file.originalname,
    size: req.file.size
  };
}

function validateUploadedFile(req) {
  if (!req.file) return null;

  if (req.file.size < upload.minFileSize) {
    return "Uploaded picture or document must be at least 1 MB.";
  }

  if (req.file.size > upload.maxFileSize) {
    return "Uploaded picture or document cannot be more than 5 MB.";
  }

  return null;
}

function getSafeHeaderFileName(fileName) {
  return (fileName || "recipe-file").replace(/["\r\n]/g, "");
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

  const fileError = validateUploadedFile(req);

  if (fileError) {
    return res.status(400).json({ message: fileError });
  }

  const {
    title,
    description,
    ingredients,
    instruction,
    cooking_time,
    category,
  } = req.body;

  const uploadedFile = getUploadedFile(req);

  try {
    const result = await pool.query(
      `INSERT INTO recipes
       (user_id, title, description, ingredients, instruction, cooking_time, category, image_data, image_mime_type, image_file_name, image_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, user_id, title, description, ingredients, instruction, cooking_time, category,
         CASE
           WHEN image_data IS NOT NULL THEN CONCAT('/api/recipes/', id, '/image')
           ELSE image_url
         END AS image_url,
         image_mime_type, image_file_name, image_size, created_at, updated_at`,
      [
        req.user.id,
        title,
        description || "",
        ingredients,
        instruction,
        Number(cooking_time),
        category || "",
        uploadedFile?.data || null,
        uploadedFile?.mimeType || null,
        uploadedFile?.fileName || null,
        uploadedFile?.size || null
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Could not create recipe." });
  }
}

async function updateRecipe(req, res) {
  const errorMessage = validateRecipe(req.body);

  if (errorMessage) {
    return res.status(400).json({ message: errorMessage });
  }

  const fileError = validateUploadedFile(req);

  if (fileError) {
    return res.status(400).json({ message: fileError });
  }

  const {
    title,
    description,
    ingredients,
    instruction,
    cooking_time,
    category,
  } = req.body;

  try {
    const currentRecipe = await pool.query(
      "SELECT id FROM recipes WHERE id = $1 AND (user_id = $2 OR $3 = true)",
      [req.params.id, req.user.id, Boolean(req.user.is_admin)]
    );

    if (currentRecipe.rows.length === 0) {
      return res.status(403).json({ message: "Only the recipe owner or admin can edit this recipe." });
    }

    const uploadedFile = getUploadedFile(req);

    const result = await pool.query(
      `UPDATE recipes
       SET title = $1,
           description = $2,
           ingredients = $3,
           instruction = $4,
           cooking_time = $5,
           category = $6,
           image_data = COALESCE($7, image_data),
           image_mime_type = COALESCE($8, image_mime_type),
           image_file_name = COALESCE($9, image_file_name),
           image_size = COALESCE($10, image_size),
           image_url = CASE WHEN $7::bytea IS NOT NULL THEN NULL ELSE image_url END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND (user_id = $12 OR $13 = true)
       RETURNING id, user_id, title, description, ingredients, instruction, cooking_time, category,
         CASE
           WHEN image_data IS NOT NULL THEN CONCAT('/api/recipes/', id, '/image')
           ELSE image_url
         END AS image_url,
         image_mime_type, image_file_name, image_size, created_at, updated_at`,
      [
        title,
        description || "",
        ingredients,
        instruction,
        Number(cooking_time),
        category || "",
        uploadedFile?.data || null,
        uploadedFile?.mimeType || null,
        uploadedFile?.fileName || null,
        uploadedFile?.size || null,
        req.params.id,
        req.user.id,
        Boolean(req.user.is_admin)
      ]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Only the recipe owner or admin can edit this recipe." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Could not update recipe." });
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
  saveRecipe,
  unsaveRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe
};
