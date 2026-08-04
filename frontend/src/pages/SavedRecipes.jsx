import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import RecipeCard from "../components/RecipeCard";

export default function SavedRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [savingRecipeId, setSavingRecipeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSavedRecipes() {
      try {
        const data = await apiRequest("/recipes/saved/list");
        setRecipes(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadSavedRecipes();
  }, []);

  async function handleToggleSave(recipeId) {
    try {
      setSavingRecipeId(recipeId);
      await apiRequest(`/recipes/${recipeId}/save`, { method: "DELETE" });
      setRecipes((currentRecipes) =>
        currentRecipes.filter((recipe) => recipe.id !== recipeId)
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSavingRecipeId(null);
    }
  }

  return (
    <section className="saved-page-panel">
      <div className="page-title">
        <p className="eyebrow">Saved recipes</p>
        <h1>Your saved listing</h1>
        <p className="muted">Recipes you saved from the main recipe library will appear here.</p>
        <Link className="button saved-browse-button" to="/recipes">Browse Recipes</Link>
      </div>

      {loading && <p className="status">Loading saved recipes...</p>}
      {error && <p className="alert error">{error}</p>}

      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            showSaveAction
            isSaved
            isSaving={savingRecipeId === recipe.id}
            savedActionLabel="Remove"
            onToggleSave={handleToggleSave}
          />
        ))}
      </div>
    </section>
  );
}
