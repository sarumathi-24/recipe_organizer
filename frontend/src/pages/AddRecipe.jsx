import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import RecipeForm from "../components/RecipeForm";
import { useAuth } from "../context/AuthContext";

export default function AddRecipe() {
  const navigate = useNavigate();
  const { user } = useAuth();

  async function handleCreate(formData) {
    const recipe = await apiRequest("/recipes", {
      method: "POST",
      body: formData
    });
    navigate(`/recipes/${recipe.id}`);
  }

  return (
    <section className="content-narrow recipe-editor-panel">
      <div className="page-title">
        <p className="eyebrow">Your recipe</p>
        <h1>{user?.is_admin ? "Add admin recipe" : "Add your own dish"}</h1>
        <p className="muted">
          {user?.is_admin
            ? "Add a recipe as the admin account. It will appear in the public recipe list and admin recipe management."
            : "Save the ingredients, cooking steps, time, category, and photos for a recipe you want to keep."}
        </p>
      </div>
      <RecipeForm buttonText="Create Recipe" onSubmit={handleCreate} />
    </section>
  );
}
