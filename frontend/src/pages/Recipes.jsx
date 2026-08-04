import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../api/api";
import RecipeCard from "../components/RecipeCard";
import { useAuth } from "../context/AuthContext";

const mealColumns = [
  { name: "Breakfast", icon: "sun" },
  { name: "Lunch", icon: "bowl" },
  { name: "Dinner", icon: "plate" },
  { name: "Snacks", icon: "snack" },
  { name: "Juices", icon: "glass" },
  { name: "Dessert", icon: "cake" }
];

function MealIcon({ type }) {
  if (type === "sun") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
      </svg>
    );
  }

  if (type === "bowl") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M4 11h16c-.4 5-3.5 8-8 8s-7.6-3-8-8Z" />
        <path d="M8 8c0-2 1.4-2 1.4-4M13 8c0-2 1.4-2 1.4-4" />
        <path d="M7 21h10" />
      </svg>
    );
  }

  if (type === "plate") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="M4 4v7M20 4v16M7 4v7M4 11h3" />
      </svg>
    );
  }

  if (type === "snack") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 9h14l-1.4 10H6.4L5 9Z" />
        <path d="M8 9l1-4h6l1 4M9 13h6M10 17h4" />
      </svg>
    );
  }

  if (type === "glass") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M7 3h10l-1.2 17H8.2L7 3Z" />
        <path d="M8 8h8M10 21h4M12 8l4-5" />
      </svg>
    );
  }

  if (type === "cake") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 11h14v9H5v-9Z" />
        <path d="M5 15c2 1.5 4 1.5 6 0s4-1.5 8 0M8 11V8M12 11V7M16 11V8" />
        <path d="M8 8c1-1 1-2 0-3M12 7c1-1 1-2 0-3M16 8c1-1 1-2 0-3" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 8h12v10H6V8Z" />
      <path d="M8 8V6h8v2M9 11h2M13 11h2M9 15h2M13 15h2" />
    </svg>
  );
}

function getMealType(category) {
  const normalizedCategory = (category || "").toLowerCase();

  if (normalizedCategory.includes("breakfast")) return "Breakfast";
  if (normalizedCategory.includes("lunch")) return "Lunch";
  if (normalizedCategory.includes("dinner")) return "Dinner";
  if (normalizedCategory.includes("snack")) return "Snacks";
  if (normalizedCategory.includes("juice") || normalizedCategory.includes("drink")) return "Juices";
  if (
    normalizedCategory.includes("sweet") ||
    normalizedCategory.includes("dessert") ||
    normalizedCategory.includes("chocolate")
  ) return "Dessert";

  return null;
}

export default function Recipes() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recipes, setRecipes] = useState([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState([]);
  const [savingRecipeId, setSavingRecipeId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mealParam = searchParams.get("meal");
  const activeMeal = mealColumns.some((meal) => meal.name === mealParam) ? mealParam : "Breakfast";

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await apiRequest("/recipes");
        setRecipes(data);

        if (user) {
          const savedIds = await apiRequest("/recipes/saved");
          setSavedRecipeIds(savedIds);
        } else {
          setSavedRecipeIds([]);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, [user]);

  async function handleToggleSave(recipeId) {
    const isSaved = savedRecipeIds.includes(recipeId);

    try {
      setSavingRecipeId(recipeId);
      await apiRequest(`/recipes/${recipeId}/save`, {
        method: isSaved ? "DELETE" : "POST"
      });

      setSavedRecipeIds((currentIds) =>
        isSaved
          ? currentIds.filter((id) => id !== recipeId)
          : [...currentIds, recipeId]
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setSavingRecipeId(null);
    }
  }

  function handleMealChange(mealName) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("meal", mealName);
      return nextParams;
    });
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const searchText = `${recipe.title} ${recipe.category} ${recipe.description}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  const recipesByMeal = mealColumns.reduce((groups, meal) => {
    groups[meal.name] = filteredRecipes.filter(
      (recipe) => getMealType(recipe.category) === meal.name
    );
    return groups;
  }, {});
  const visibleMealRecipeCount = mealColumns.reduce(
    (total, meal) => total + recipesByMeal[meal.name].length,
    0
  );
  const activeRecipes = recipesByMeal[activeMeal] || [];

  return (
    <section className="recipes-page">
      <div className="recipes-hero">
        <div className="recipes-grid-lines"></div>

        <div className="recipes-hero-content">
          <p className="recipes-kicker">Recipe library</p>
          <h1>Browse recipes without losing your place.</h1>
          <p>
            Search by name, category, or notes, then open the recipe details when a dish catches your eye.
          </p>
          <div className="recipes-hero-actions">
            <Link className="button light-button" to="/">Main Page</Link>
            {user ? (
              <Link className="button neon-button" to="/recipes/new">Add Your Dish</Link>
            ) : (
              <Link className="button neon-button" to="/login">Login to Add Dish</Link>
            )}
          </div>
        </div>

        <div className="recipes-stat-card">
          <span>Total Recipes</span>
          <strong>{recipes.length}</strong>
          <span>Showing {visibleMealRecipeCount}</span>
        </div>
      </div>

      <div className="recipes-panel">
        <div className="recipes-panel-heading">
          <p className="recipes-kicker">Browse</p>
          <h2>Pick a Topic</h2>
          <span>{visibleMealRecipeCount} categorized recipes visible</span>
        </div>
        <div className="recipe-tools">
          <label className="search-wrap">
            <span>Search recipes</span>
            <input
              className="search"
              placeholder="Search by title, category, or notes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          {user && <Link className="button" to="/recipes/new">Add Dish</Link>}
        </div>
      </div>

      <div className="contribute-panel">
        <div>
          <p className="recipes-kicker">Share a dish</p>
          <h2>Add your own recipe to the collection</h2>
          <p>
            Upload a photo, write ingredients and instructions, and keep your homemade dishes in your account.
          </p>
        </div>
        <div className="contribute-actions">
          {user ? (
            <Link className="button" to="/recipes/new">Add Your Dish</Link>
          ) : (
            <>
              <Link className="button" to="/login">Login to Add</Link>
              <Link className="button secondary" to="/signup">Create Account</Link>
            </>
          )}
        </div>
      </div>

      {loading && <p className="status">Loading recipes...</p>}
      {error && <p className="alert error">{error}</p>}
      {!loading && !error && recipes.length === 0 && (
        <div className="empty-state">
          <p className="recipes-kicker">No recipes</p>
          <h2>No recipes added yet</h2>
          <p>Add the first dish to start filling these topics.</p>
        </div>
      )}
      {!loading && !error && recipes.length > 0 && (
        <>
        <div className="meal-topic-grid" aria-label="Recipe topics">
          {mealColumns.map((meal) => (
            <button
              className={activeMeal === meal.name ? "meal-topic active" : "meal-topic"}
              key={meal.name}
              onClick={() => handleMealChange(meal.name)}
              type="button"
            >
              <span className="meal-icon">
                <MealIcon type={meal.icon} />
              </span>
              <strong>{meal.name}</strong>
              <span>{recipesByMeal[meal.name].length} recipes</span>
            </button>
          ))}
        </div>

        <section className="active-meal-section">
          {activeRecipes.length > 0 ? (
            <div className="recipe-grid">
              {activeRecipes.map((recipe, index) => (
                <div
                  className="recipe-card-motion"
                  key={recipe.id}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <RecipeCard
                    recipe={recipe}
                    showSaveAction={Boolean(user)}
                    isSaved={savedRecipeIds.includes(recipe.id)}
                    isSaving={savingRecipeId === recipe.id}
                    onToggleSave={handleToggleSave}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="meal-empty">No {activeMeal.toLowerCase()} recipes yet.</p>
          )}
        </section>
        </>
      )}
    </section>
  );
}
