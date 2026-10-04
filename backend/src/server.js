import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "FinBank backend is running",
  });
});

const startServer = async () => {
  try {
    await pool.query("SELECT 1");

    console.log("Database connected successfully.");

    app.listen(PORT, () => {
      console.log(`FinBank backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed.");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
