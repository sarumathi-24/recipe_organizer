import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError("Enter email");
      return;
    }

    if (!form.password) {
      setError("Enter password");
      return;
    }

    try {
      await login(form);
      navigate("/recipes");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="auth-page">
      <form className="form" onSubmit={handleSubmit} autoComplete="off">
        <h1>Login</h1>
        {error && <p className="alert error">{error}</p>}
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onInvalid={(event) => event.target.setCustomValidity("Enter email")}
            onInput={(event) => event.target.setCustomValidity("")}
            autoComplete="off"
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            onInvalid={(event) => event.target.setCustomValidity("Enter password")}
            onInput={(event) => event.target.setCustomValidity("")}
            autoComplete="new-password"
            required
          />
        </label>
        <button className="button">Login</button>
        <p className="muted">New here? <Link to="/signup">Create account</Link></p>
      </form>
    </section>
  );
}
