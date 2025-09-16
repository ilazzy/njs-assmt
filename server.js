import express from "express";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js";
import userRoutes from "./routes/user.routes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api-user", userRoutes);

app.get("/", (req, res) => {
  res.json("users", { title: "User Management App" });
});

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err.message);
  }
};

start();
