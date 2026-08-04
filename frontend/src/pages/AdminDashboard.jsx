import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import RecipeCard from "../components/RecipeCard";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await apiRequest("/recipes");
        setRecipes(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (user?.is_admin) {
      loadRecipes();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this recipe as admin?");
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

  if (!user?.is_admin) {
    return (
      <section className="profile-box">
        <h1>Admin only</h1>
        <p className="muted">Login with the admin account to open this panel.</p>
        <Link className="button" to="/login">Login</Link>
      </section>
    );
  }

  return (
    <section>
      <div className="page-title">
        <p className="eyebrow">Admin panel</p>
        <h1>Manage all recipes</h1>
        <p className="muted">Admins can review, edit, and delete recipes added by any user.</p>
      </div>

      {message && <p className="alert success">{message}</p>}
      {error && <p className="alert error">{error}</p>}
      {loading && <p className="status">Loading recipes...</p>}
      {!loading && recipes.length === 0 && (
        <p className="status">No recipes have been added yet.</p>
      )}

      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            showActions
            onDelete={handleDelete}
          />
        ))}
      </div>
    </section>
  );
}
