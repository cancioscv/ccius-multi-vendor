import cookieParser from "cookie-parser";

import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send({ message: "Welcome to chatting-service!" });
});

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 6006;
const server = app.listen(port, () => {
  console.log(`Chatting Service running on http://localhost:${port}/api`);
});
server.on("error", console.error);
