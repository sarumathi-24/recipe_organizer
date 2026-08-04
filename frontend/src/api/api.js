const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SERVER_URL = API_URL.replace("/api", "");

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("recipe_token");
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export function getImageUrl(imagePath) {
  if (!imagePath) {
    return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=900&q=80";
  }

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  return `${SERVER_URL}${imagePath}`;
}

export function isPreviewableImage(recipe) {
  return !recipe?.image_mime_type || recipe.image_mime_type.startsWith("image/");
}
