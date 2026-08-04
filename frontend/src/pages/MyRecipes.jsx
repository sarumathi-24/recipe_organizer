import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import RecipeCard from "../components/RecipeCard";
import { useAuth } from "../context/AuthContext";

export default function MyRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadRecipes() {
    try {
      const data = await apiRequest("/recipes/mine");
      setRecipes(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this recipe?");
    if (!confirmed) return;

    try {
      await apiRequest(`/recipes/${id}`, { method: "DELETE" });
      setRecipes((currentRecipes) =>
        currentRecipes.filter((recipe) => recipe.id !== id)
      );
      setMessage("Recipe deleted.");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">{user?.is_admin ? "Admin recipes" : "Your recipes"}</p>
          <h1>{user?.is_admin ? "All Recipes" : "My Recipes"}</h1>
        </div>
        <Link className="button" to="/recipes/new">
          {user?.is_admin ? "Add Admin Recipe" : "Add Recipe"}
        </Link>
      </div>
      {message && <p className="alert success">{message}</p>}
      {error && <p className="alert error">{error}</p>}
      {loading && <p className="status">Loading your recipes...</p>}
      {!loading && recipes.length === 0 && (
        <p className="status">
          {user?.is_admin ? "No recipes have been added yet." : "You have not added any recipes yet."}
        </p>
      )}
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} showActions onDelete={handleDelete} />
        ))}
      </div>
    </section>
  );
}
