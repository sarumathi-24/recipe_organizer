import { Link } from "react-router-dom";
import { getImageUrl, isPreviewableImage } from "../api/api";

export default function RecipeCard({
  recipe,
  showActions = false,
  onDelete,
  showSaveAction = false,
  isSaved = false,
  isSaving = false,
  savedActionLabel = "Saved",
  onToggleSave
}) {
  const imageSource = isPreviewableImage(recipe) ? getImageUrl(recipe.image_url) : getImageUrl("");

  return (
    <article className="recipe-card">
      <div className="recipe-card-media">
        <img
          src={imageSource}
          alt={recipe.title}
          loading="lazy"
        />
      </div>
      <div className="recipe-card-body">
        <div>
          <p className="pill">{recipe.category || "General"}</p>
          <h3>{recipe.title}</h3>
          <p className="recipe-description">{recipe.description || "No description added yet."}</p>
        </div>
        <p className="recipe-meta">{recipe.cooking_time} min cook time</p>
        <div className="card-actions">
          <Link className="button secondary" to={`/recipes/${recipe.id}`}>View</Link>
          {showSaveAction && (
            <button
              className={isSaved ? "button saved-button" : "button secondary"}
              disabled={isSaving}
              onClick={() => onToggleSave(recipe.id)}
              type="button"
            >
              {isSaving ? "Saving..." : isSaved ? savedActionLabel : "Save"}
            </button>
          )}
          {showActions && <Link className="button secondary" to={`/recipes/${recipe.id}/edit`}>Edit</Link>}
          {showActions && <button className="button danger" onClick={() => onDelete(recipe.id)}>Delete</button>}
        </div>
      </div>
    </article>
  );
}
