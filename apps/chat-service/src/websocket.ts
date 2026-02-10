import redis from "@e-com/libs";
import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
// import { producer } from "./utils/kafka.js";

import { kafka } from "@e-com/kafka";

const producer = kafka.producer();

const connectedUsers: Map<string, WebSocket> = new Map();
const unseenCounts: Map<string, number> = new Map();

interface IncomingMessage {
  type?: string;
  fromUserId: string;
  toUserId: string;
  messageBody: string;
  conversationId: string;
  senderType: string;
}

export async function createWebSocketServer(server: HttpServer) {
  const webSocketServer = new WebSocketServer({ server });

  await producer.connect();
  console.log("Kafka producer connected!");

  webSocketServer.on("connection", (ws: WebSocket) => {
    console.log("New Websocket connection!");

    let registeredUseId: string | null = null;

    ws.on("message", async (rawMessage) => {
      try {
        const stringMsg = rawMessage.toString();

        // Register the user on first plain message (non-JSON)
        if (!registeredUseId && !stringMsg.startsWith("{")) {
          registeredUseId = stringMsg;
          connectedUsers.set(registeredUseId, ws);
          console.log(`Registered websocket for userId: ${registeredUseId}`);

          const isSeller = registeredUseId.startsWith("seller_");
          const redisKey = isSeller ? `online:seller:${registeredUseId.replace("seller_", "")}` : `online:user:${registeredUseId}`;
          await redis.set(redisKey, "1");
          await redis.expire(redisKey, 300);
          return;
        }

        // Process JSON message
        const data: IncomingMessage = JSON.parse(stringMsg);

        // If it is seen, update
        if (data.type === "MARK_AS_SEEN" && registeredUseId) {
          const seenKey = `${registeredUseId}_${data.conversationId}`;
          unseenCounts.set(seenKey, 0);
          return;
        }

        // Regular messag
        const { conversationId, fromUserId, toUserId, messageBody, senderType } = data;

        if (!data || !toUserId || !messageBody || !conversationId) {
          console.warn("Invalid messagee format:", data);
          return;
        }

        const now = new Date().toISOString();

        const messagePayload = {
          conversationId,
          senderId: fromUserId,
          senderType,
          content: messageBody,
          createdAt: now,
        };

        console.log("THIS IS MY MESSAGE PAYLOAD FROM WEBSOCKET", messagePayload);

        const messageEvent = JSON.stringify({
          type: "NEW_MESSAGE",
          payload: messagePayload,
        });

        const receiverKey = senderType === "user" ? `seller_${toUserId}` : `user_${toUserId}`;
        const senderKey = senderType === "user" ? `seller_${fromUserId}` : `user_${fromUserId}`;

        // Update unseen count dynamically
        const unseenKey = `${receiverKey}_${conversationId}`;
        const prevCount = unseenCounts.get(unseenKey) || 0;
        unseenCounts.set(unseenKey, prevCount + 1);

        // Send new message to receiver
        const receiverSocket = connectedUsers.get(receiverKey);
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
          receiverSocket.send(messageEvent);

          // Also notify unseen count
          receiverSocket.send(
            JSON.stringify({
              type: "UNSEEN_COUNT_UPDATE",
              payload: {
                conversationId,
                count: prevCount + 1,
              },
            })
          );
          console.log(`Delivered messate plus unseen count to ${receiverKey}`);
        } else {
          console.log(`User ${receiverKey} is offline. Message queued.`);
        }

        // Echo to sender
        const senderSocket = connectedUsers.get(senderKey);
        if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
          senderSocket.send(messageEvent);
          console.log(`Echoed message to sender ${senderKey}`);
        }

        // Push to kafka consumer
        // await producer.send("new.message", {
        //   value: {
        //     key: conversationId,
        //     value: JSON.stringify(messagePayload),
        //   },
        // });
        await producer.send({
          topic: "new.message",
          messages: [
            {
              key: conversationId,
              value: JSON.stringify(messagePayload),
            },
          ],
        });
        console.log(`Message queued to kafka: ${conversationId}`);
      } catch (error) {
        console.error("Error processing WebSocket message", error);
      }
    });

    ws.on("close", async () => {
      if (registeredUseId) {
        connectedUsers.delete(registeredUseId);
        console.log(`Disconnected user ${registeredUseId}`);

        const isSeller = registeredUseId.startsWith("seller_");
        const redisKey = isSeller ? `online:seller:${registeredUseId.replace("seller_", "")}` : `online:user:${registeredUseId}`;

        await redis.del(redisKey);
      }
    });

    ws.on("error", (err) => {
      console.error("Websocket error:", err);
    });
  });
  console.log("WebSocket server ready.");
}
