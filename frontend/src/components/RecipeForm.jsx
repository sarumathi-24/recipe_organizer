import { useState } from "react";
import { getImageUrl, isPreviewableImage } from "../api/api";

const emptyRecipe = {
  title: "",
  description: "",
  ingredients: "",
  instruction: "",
  cooking_time: "",
  category: ""
};

const categoryOptions = ["Breakfast", "Lunch", "Dinner", "Snacks", "Juices", "Dessert"];

export default function RecipeForm({ initialRecipe = emptyRecipe, buttonText, onSubmit }) {
  const [form, setForm] = useState({ ...emptyRecipe, ...initialRecipe });
  const [imageFiles, setImageFiles] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "cooking_time") {
      if (value === "") {
        setForm({ ...form, cooking_time: "" });
        return;
      }

      const limitedValue = Math.min(120, Math.max(1, Number(value)));
      setForm({ ...form, cooking_time: String(limitedValue) });
      return;
    }

    setForm({ ...form, [name]: value });
  }

  function handleFileChange(event) {
    setError("");
    setImageFiles(Array.from(event.target.files || []));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("ingredients", form.ingredients);
      formData.append("instruction", form.instruction);
      formData.append("cooking_time", form.cooking_time);
      formData.append("category", form.category);

      if (imageFiles.length > 0) {
        imageFiles.forEach((imageFile) => {
          formData.append("images", imageFile);
        });
      }

      await onSubmit(formData);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form wide-form" onSubmit={handleSubmit}>
      {error && <p className="alert error">{error}</p>}
      <label>
        Title
        <input name="title" value={form.title} onChange={handleChange} required />
      </label>
      <label>
        Description
        <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
      </label>
      <label>
        Ingredients
        <textarea name="ingredients" value={form.ingredients} onChange={handleChange} rows="5" required />
      </label>
      <label>
        Instruction
        <textarea name="instruction" value={form.instruction} onChange={handleChange} rows="5" required />
      </label>
      <div className="form-grid">
        <label>
          Cooking Time
          <input
            name="cooking_time"
            type="number"
            min="1"
            max="120"
            value={form.cooking_time}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Choose category</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="image-upload-field">
        <span>Recipe Photos or Documents</span>
        <input
          name="images"
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          onChange={handleFileChange}
        />
      </label>
      <p className="muted">
        {imageFiles.length > 0
          ? `${imageFiles.length} file${imageFiles.length === 1 ? "" : "s"} selected.`
          : "Choose as many pictures, PDFs, or Word documents as you need."}
      </p>
      {(initialRecipe.images?.length > 0 || initialRecipe.image_url) && (
        <div className="current-image-note">
          {initialRecipe.images?.length > 0 ? (
            <div className="current-image-gallery">
              {initialRecipe.images.slice(0, 6).map((image) => (
                isPreviewableImage(image) ? (
                  <img key={image.id} src={getImageUrl(image.url)} alt={`${form.title || "Recipe"} saved`} />
                ) : (
                  <span key={image.id}>{image.file_name || "Saved document"}</span>
                )
              ))}
            </div>
          ) : isPreviewableImage(initialRecipe) ? (
            <img src={getImageUrl(initialRecipe.image_url)} alt={`${form.title || "Recipe"} current`} />
          ) : (
            <p>{initialRecipe.image_file_name || "Current document"} is saved in the database.</p>
          )}
          <p>Current files will stay saved. New uploads will be added to this recipe.</p>
        </div>
      )}
      <button className="button" disabled={saving}>{saving ? "Saving..." : buttonText}</button>
    </form>
  );
}
