import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      await signup(form);
      navigate("/recipes");
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="auth-page">
      <form className="form" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        {error && <p className="alert error">{error}</p>}
        <label>
          Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onInvalid={(event) => event.target.setCustomValidity("Enter email")}
            onInput={(event) => event.target.setCustomValidity("")}
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
            required
          />
        </label>
        <button className="button">Signup</button>
        <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
}
