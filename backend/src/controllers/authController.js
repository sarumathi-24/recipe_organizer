const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function getSafeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    is_admin: Boolean(user.is_admin),
    created_at: user.created_at
  };
}

async function signup(req, res) {
  const { name, email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!name) {
    return res.status(400).json({ message: "Enter name" });
  }

  if (!email) {
    return res.status(400).json({ message: "Enter email" });
  }

  if (!password) {
    return res.status(400).json({ message: "Enter password" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const existingUser = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [normalizedEmail]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isAdminSignup = Boolean(adminEmail && normalizedEmail === adminEmail);
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, name, email, is_admin, created_at",
      [name, normalizedEmail, passwordHash, isAdminSignup]
    );

    const user = getSafeUser(result.rows[0]);
    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed." });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Enter email" });
  }

  if (!password) {
    return res.status(400).json({ message: "Enter password" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const safeUser = getSafeUser(user);

    return res.json({ user: safeUser, token: createToken(safeUser) });
  } catch (error) {
    return res.status(500).json({ message: "Login failed." });
  }
}

async function profile(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, email, is_admin, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ message: "Could not load profile." });
  }
}

module.exports = { signup, login, profile };
