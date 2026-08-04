import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="nav">
      <Link to="/" className="brand">DishBook</Link>
      <nav className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        {user && <NavLink to="/recipes" end>Recipes</NavLink>}
        {user && <NavLink to="/recipes/new">Add Dish</NavLink>}
        {user && <NavLink to="/my-recipes">My Recipes</NavLink>}
        {user && <NavLink to="/saved-recipes">Saved</NavLink>}
        {user && <NavLink to="/profile">Profile</NavLink>}
        {user?.is_admin && <NavLink className="admin-link" to="/admin">Admin Panel</NavLink>}
        {user && <button className="link-button" onClick={handleLogout}>Logout</button>}
      </nav>
    </header>
  );
}
