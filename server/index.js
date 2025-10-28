const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const posts = require("./routes/posts");
const auth = require("./routes/auth");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

// Healthcheck
app.get("/healthz", (_req, res) => res.send("ok"));
app.use("/api/posts", posts);
app.use("/api/auth", auth);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`);
});
