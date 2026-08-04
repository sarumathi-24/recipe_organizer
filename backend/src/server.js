const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const recipeRoutes = require("./routes/recipeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174"
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Recipe Organizer API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Uploaded picture or document cannot be more than 5 MB." });
  }

  if (error.message === "Only picture, PDF, or Word document files are allowed.") {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

app.use((req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((error, req, res, next) => {
  return res.status(500).json({ message: "Server error." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
