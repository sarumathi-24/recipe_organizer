import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("recipe_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("recipe_token");

    if (!token) return;

    async function refreshProfile() {
      try {
        const profile = await apiRequest("/auth/profile");
        localStorage.setItem("recipe_user", JSON.stringify(profile));
        setUser(profile);
      } catch (error) {
        logout();
      }
    }

    refreshProfile();
  }, []);

  async function signup(formData) {
    const data = await apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    saveAuth(data);
  }

  async function login(formData) {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    saveAuth(data);
  }

  function saveAuth(data) {
    localStorage.setItem("recipe_token", data.token);
    localStorage.setItem("recipe_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("recipe_token");
    localStorage.removeItem("recipe_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, signup, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
