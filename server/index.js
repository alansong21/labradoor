const express = require("express");
const cors = require("cors");
const posts = require("./routes/posts");

const app = express();
app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/healthz", (_req, res) => res.send("ok"));

app.use("/api/posts", posts);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`);
});