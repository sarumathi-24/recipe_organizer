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
const oneMb = 1024 * 1024;
const fiveMb = 5 * oneMb;

export default function RecipeForm({ initialRecipe = emptyRecipe, buttonText, onSubmit }) {
  const [form, setForm] = useState({ ...emptyRecipe, ...initialRecipe });
  const [imageFile, setImageFile] = useState(null);
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
    const selectedFile = event.target.files[0] || null;

    if (selectedFile && (selectedFile.size < oneMb || selectedFile.size > fiveMb)) {
      setImageFile(null);
      setError("Upload a picture or document from 1 MB to 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setImageFile(selectedFile);
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

      if (imageFile) {
        formData.append("image", imageFile);
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
        <span>Recipe Picture or Document</span>
        <input
          name="image"
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
        />
      </label>
      <p className="muted">Choose a picture, PDF, or Word document from 1 MB to 5 MB.</p>
      {initialRecipe.image_url && (
        <div className="current-image-note">
          {isPreviewableImage(initialRecipe) ? (
            <img src={getImageUrl(initialRecipe.image_url)} alt={`${form.title || "Recipe"} current`} />
          ) : (
            <p>{initialRecipe.image_file_name || "Current document"} is saved in the database.</p>
          )}
          <p>Current file will stay the same unless you choose a new one.</p>
        </div>
      )}
      <button className="button" disabled={saving}>{saving ? "Saving..." : buttonText}</button>
    </form>
  );
}
