import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.get("/", (req, res) => {
  res.send({ message: "Welcome to recommendation-service!" });
});

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 6008;
const server = app.listen(port, () => {
  console.log(`Recommendation Service running on http://localhost:${port}/api`);
});
server.on("error", console.error);
