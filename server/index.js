const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Example API route
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express 👋" });
});

// Healthcheck
app.get("/healthz", (_req, res) => res.send("ok"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`);
});