import express from "express";
import cookieParser from "cookie-parser";

// import recommendationRouter from "./routes/recommendation.routes.js";

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to recommendation-service!" });
});

// Routes
// app.use("/api", recommendationRouter);

const port = process.env.PORT || 6008;
const server = app.listen(port, () => {
  console.log(`Recommendation Service running on http://localhost:${port}/api`);
});
server.on("error", console.error);
