/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);
app.get("/api", (req, res) => {
  res.send({ message: "Welcome to order-service!" });
});

const port = process.env.PORT || 6003;
const server = app.listen(port, () => {
  console.log(`Order Service running on http://localhost:${port}/api`);
});
server.on("error", console.error);
