const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const posts = require("./routes/posts");
const auth = require("./routes/auth");
const users = require("./routes/users"); 
const applications = require("./routes/applications");
const answers = require("./routes/answers");
const questions = require("./routes/questions");
const admin = require("./routes/admin");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

// Healthcheck
app.get("/healthz", (_req, res) => res.send("ok"));

// API routes
app.use("/api/posts", posts);
app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/applications", applications);
app.use("/api/answers", answers);
app.use("/api/questions", questions);
app.use("/api/admin", admin);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`);
});
