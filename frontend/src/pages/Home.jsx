import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [recipeCount, setRecipeCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    async function loadHomeStats() {
      try {
        const recipes = await apiRequest("/recipes");
        setRecipeCount(recipes.length);

        if (user) {
          const savedIds = await apiRequest("/recipes/saved");
          setSavedCount(savedIds.length);
        } else {
          setSavedCount(0);
        }
      } catch (error) {
        setRecipeCount(0);
        setSavedCount(0);
      }
    }

    loadHomeStats();
  }, [user]);

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">Save. Cook. Repeat.</p>
          <h1>Your DishBook.</h1>
          <p>
            Save recipes, add photos, and cook your favorites anytime.
          </p>
          <div className="home-actions">
            {user ? (
              <Link className="button" to="/recipes/new">Add Your Dish</Link>
            ) : (
              <Link className="button" to="/signup">Create Account</Link>
            )}
            <Link className="button secondary" to="/recipes">View Recipes</Link>
          </div>
          <div className="home-stats" aria-label="Recipe organizer stats">
            <span><strong>{recipeCount}</strong> recipes available</span>
            <span><strong>{user ? savedCount : "Save"}</strong> favorites</span>
            <span><strong>Add</strong> your own dishes</span>
          </div>
        </div>

        <div className="home-hero-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80"
            alt=""
          />
          <div className="home-floating-note note-one">
            <span>Step by step</span>
            <strong>Clear instructions</strong>
          </div>
          <div className="home-floating-note note-two">
            <span>Saved list</span>
            <strong>{user ? `${savedCount} kept` : "Login to save"}</strong>
          </div>
        </div>
      </div>

    </section>
  );
}
