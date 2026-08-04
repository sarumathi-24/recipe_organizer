const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
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
} = require("../controllers/recipeController");

const router = express.Router();

router.get("/", getAllRecipes);
router.get("/mine", authMiddleware, getMyRecipes);
router.get("/saved", authMiddleware, getSavedRecipeIds);
router.get("/saved/list", authMiddleware, getSavedRecipes);
router.get("/:id", getRecipeById);
router.post("/", authMiddleware, upload.single("image"), createRecipe);
router.post("/:id/save", authMiddleware, saveRecipe);
router.put("/:id", authMiddleware, upload.single("image"), updateRecipe);
router.delete("/:id/save", authMiddleware, unsaveRecipe);
router.delete("/:id", authMiddleware, deleteRecipe);

module.exports = router;
