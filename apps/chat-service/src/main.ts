import cookieParser from "cookie-parser";

import express from "express";
import { createWebSocketServer } from "./websocket.js";
import { startConsumer } from "./chatMessageConsumer.js";

const app = express();

app.get("/", (req, res) => {
  res.send({ message: "Welcome to chat-service!" });
});

app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 6006;
const server = app.listen(port, () => {
  console.log(`Chat Service running on http://localhost:${port}/api`);
});

// WebSocket server
createWebSocketServer(server);

// Start kafka consumer
startConsumer().catch((error: any) => {
  console.log(error);
});

server.on("error", console.error);
