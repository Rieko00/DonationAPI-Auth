require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const db = require("./models");
const authRoutes = require("./routes/auth.routes");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Auth API." });
});

app.use("/auth", authRoutes);

// Setup for both local development and Vercel
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
}

// Connect to database
db.sequelize
  .sync()
  .then(() => {
    console.log("Database synchronized successfully.");
  })
  .catch((err) => {
    console.error("Failed to sync database:", err.message);
  });

// Export for Vercel
module.exports = app;
