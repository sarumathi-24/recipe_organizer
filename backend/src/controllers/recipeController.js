const pool = require("../config/db");

const ALLOWED_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snacks", "Juices", "Dessert"];

function getUploadedImagePath(req, currentImagePath = "") {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }

  return currentImagePath;
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
      `SELECT recipes.*, users.name AS author_name
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
        `SELECT recipes.*, users.name AS author_name
         FROM recipes
         JOIN users ON users.id = recipes.user_id
         ORDER BY recipes.created_at DESC`
      );

      return res.json(adminResult.rows);
    }

    const result = await pool.query(
      "SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC",
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
      `SELECT recipes.*, users.name AS author_name, saved_recipes.created_at AS saved_at
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
      `SELECT recipes.*, users.name AS author_name
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

  const imageUrl = getUploadedImagePath(req);

  try {
    const result = await pool.query(
      `INSERT INTO recipes
       (user_id, title, description, ingredients, instruction, cooking_time, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        title,
        description || "",
        ingredients,
        instruction,
        Number(cooking_time),
        category || "",
        imageUrl
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
      "SELECT image_url FROM recipes WHERE id = $1 AND (user_id = $2 OR $3 = true)",
      [req.params.id, req.user.id, Boolean(req.user.is_admin)]
    );

    if (currentRecipe.rows.length === 0) {
      return res.status(403).json({ message: "Only the recipe owner or admin can edit this recipe." });
    }

    const imageUrl = getUploadedImagePath(req, currentRecipe.rows[0].image_url || "");

    const result = await pool.query(
      `UPDATE recipes
       SET title = $1,
           description = $2,
           ingredients = $3,
           instruction = $4,
           cooking_time = $5,
           category = $6,
           image_url = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND (user_id = $9 OR $10 = true)
       RETURNING *`,
      [
        title,
        description || "",
        ingredients,
        instruction,
        Number(cooking_time),
        category || "",
        imageUrl,
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
  saveRecipe,
  unsaveRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe
};
