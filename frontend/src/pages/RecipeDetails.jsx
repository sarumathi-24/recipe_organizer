import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest, getImageUrl } from "../api/api";
import { useAuth } from "../context/AuthContext";

function splitRecipeText(text) {
  if (!text) return [];

  const lines = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map((item) => item.replace(/^\d+[\).:-]?\s*/, ""));
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function RecipeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await apiRequest(`/recipes/${id}`);
        setRecipe(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [id]);

  if (loading) return <p className="status">Loading recipe...</p>;
  if (error) return <p className="alert error">{error}</p>;

  const isOwner = user && (recipe.user_id === user.id || user.is_admin);
  const category = recipe.category || "General";
  const ingredients = splitRecipeText(recipe.ingredients);
  const instructions = splitRecipeText(recipe.instruction);

  return (
    <article className="recipe-detail-page">
      <section className="recipe-detail-hero">
        <div className="recipe-detail-copy">
          <Link className="detail-back-link" to="/recipes">Back to recipes</Link>
          <p className="pill">{category}</p>
          <h1>{recipe.title}</h1>
          <p className="detail-meta">By {recipe.author_name} | {recipe.cooking_time} minutes</p>
          <p className="detail-description">
            {recipe.description || "No description added yet."}
          </p>
          <div className="detail-actions">
            {isOwner && <Link className="button secondary" to={`/recipes/${recipe.id}/edit`}>Edit Recipe</Link>}
            <Link className="button" to="/recipes/new">Add Your Dish</Link>
          </div>
        </div>

        <div className="recipe-detail-image">
          <img
            src={getImageUrl(recipe.image_url)}
            alt={recipe.title}
          />
        </div>
      </section>

      <section className="recipe-detail-content">
        <aside className="detail-summary">
          <p className="eyebrow">Recipe info</p>
          <div>
            <span>Cook time</span>
            <strong>{recipe.cooking_time} min</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>{category}</strong>
          </div>
          <div>
            <span>Author</span>
            <strong>{recipe.author_name}</strong>
          </div>
        </aside>

        <div className="detail-main">
          <section className="detail-section">
            <p className="eyebrow">What you need</p>
            <h2>Ingredients</h2>
            {ingredients.length > 0 ? (
              <ul className="ingredient-list">
                {ingredients.map((ingredient, index) => (
                  <li key={`${ingredient}-${index}`}>{ingredient}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No ingredients added yet.</p>
            )}
          </section>

          <section className="detail-section">
            <p className="eyebrow">Cook it</p>
            <h2>Instructions</h2>
            {instructions.length > 0 ? (
              <ol className="instruction-steps">
                {instructions.map((instruction, index) => (
                  <li key={`${instruction}-${index}`}>
                    <span>Step {index + 1}</span>
                    <p>{instruction}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">No instructions added yet.</p>
            )}
          </section>
        </div>
      </section>
    </article>
  );
}
