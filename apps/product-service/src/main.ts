/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";

const app = express();

app.get("/api", (req, res) => {
  res.send({ message: "Welcome to product-service!" });
});

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Product Service running at http://localhost:${port}/api`);
});
server.on("error", console.error);
