import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/api";
import RecipeForm from "../components/RecipeForm";
import { useAuth } from "../context/AuthContext";

export default function EditRecipe() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecipe() {
      try {
        const data = await apiRequest(`/recipes/${id}`);

        if (data.user_id !== user.id && !user.is_admin) {
          setError("Only the recipe owner or admin can edit this recipe.");
        } else {
          setRecipe(data);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [id, user.id, user.is_admin]);

  async function handleUpdate(formData) {
    const updatedRecipe = await apiRequest(`/recipes/${id}`, {
      method: "PUT",
      body: formData
    });
    navigate(`/recipes/${updatedRecipe.id}`);
  }

  if (loading) return <p className="status">Loading recipe...</p>;
  if (error) return <p className="alert error">{error}</p>;

  return (
    <section className="content-narrow recipe-editor-panel">
      <div className="page-title">
        <p className="eyebrow">Update recipe</p>
        <h1>Edit Recipe</h1>
        <p className="muted">Change the recipe details, or leave the image empty to keep the current picture.</p>
      </div>
      <RecipeForm initialRecipe={recipe} buttonText="Save Changes" onSubmit={handleUpdate} />
    </section>
  );
}
