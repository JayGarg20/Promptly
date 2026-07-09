const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// DB Connection
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/promptly";
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Database Connected Successfully..."))
  .catch((err) => {
    console.error("Database connection failure:", err.message);
    process.exit(1);
  });

// API Routes Registration
app.use("/api/auth", require("./routes/auth"));
app.use("/api/threads", require("./routes/threads"));
app.use("/api/prompts", require("./routes/prompts"));

// Default Fallback Route
app.get("/", (req, res) => {
  res.send("Promptly API Services Running...");
});

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server executing uplink on port ${PORT}`);
  });
}

module.exports = app;
