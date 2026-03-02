// import { WebSocket, WebSocketServer } from "ws";
import express from "express";
import http from "http";
// import { consumeKafkaMessages } from "./loggerConsumer.js";

const app = express();

// const wsServer = new WebSocketServer({ noServer: true });

// export const clients = new Set<WebSocket>();

// wsServer.on("connection", (ws) => {
//   console.log("New logger client connected!");
//   clients.add(ws);

//   ws.on("close", () => {
//     console.log("Logger client disconnected!");
//     clients.delete(ws);
//   });
// });

const server = http.createServer(app);

// server.on("upgrade", (request, socket, head) => {
//   wsServer.handleUpgrade(request, socket, head, (ws) => {
//     wsServer.emit("connection", ws, request);
//   });
// });

const port = process.env.PORT || 6007;

server.listen(port, () => {
  console.log(`Logger Service running on http://localhost:${port}/api`);
});
server.on("error", console.error);

// Start Kafka consumer
// consumeKafkaMessages();
