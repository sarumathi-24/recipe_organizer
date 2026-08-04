const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const recipeRoutes = require("./routes/recipeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Recipe Organizer API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
