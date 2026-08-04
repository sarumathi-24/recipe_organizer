import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    myRecipes: 0,
    savedRecipes: 0
  });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileData, myRecipesData, savedRecipesData] = await Promise.all([
          apiRequest("/auth/profile"),
          apiRequest("/recipes/mine"),
          apiRequest("/recipes/saved/list")
        ]);

        setProfile(profileData);
        setStats({
          myRecipes: myRecipesData.length,
          savedRecipes: savedRecipesData.length
        });
      } catch (error) {
        setError(error.message);
      }
    }

    loadProfile();
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (error) return <p className="alert error">{error}</p>;
  if (!profile) return <p className="status">Loading profile...</p>;

  const initials = (profile.name || profile.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const joinedDate = new Date(profile.created_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <section className="profile-page">
      <div className="profile-hero-card">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div className="profile-main">
          <p className="eyebrow">Account profile</p>
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
          <span className={profile.is_admin ? "role-badge admin" : "role-badge"}>
            {profile.is_admin ? "Admin account" : "Recipe member"}
          </span>
        </div>
      </div>

      <div className="profile-stats-grid" aria-label="Profile summary">
        <div className="profile-stat">
          <span>Recipes</span>
          <strong>{stats.myRecipes}</strong>
        </div>
        <div className="profile-stat">
          <span>Saved</span>
          <strong>{stats.savedRecipes}</strong>
        </div>
        <div className="profile-stat">
          <span>Joined</span>
          <strong>{joinedDate}</strong>
        </div>
      </div>

      <div className="profile-content-grid">
        <div className="profile-panel">
          <p className="eyebrow">Details</p>
          <dl className="profile-details-list">
            <div>
              <dt>Name</dt>
              <dd>{profile.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile.is_admin ? "Admin" : "User"}</dd>
            </div>
          </dl>
        </div>

        <div className="profile-panel">
          <p className="eyebrow">Shortcuts</p>
          <div className="profile-actions">
            <Link className="button" to="/recipes/new">Add Dish</Link>
            <Link className="button secondary" to="/my-recipes">My Recipes</Link>
            <Link className="button secondary" to="/saved-recipes">Saved Recipes</Link>
            {profile.is_admin && <Link className="button secondary" to="/admin">Admin Panel</Link>}
            <button className="button danger" type="button" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </section>
  );
}
