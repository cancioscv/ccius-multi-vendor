import { prisma } from "@e-com/db";
import { kafka } from "@e-com/kafka";
import { incrementUnseenCount } from "@e-com/libs";

import { EachMessagePayload } from "kafkajs";

interface BufferedMessage {
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  createdAt: string;
}

const TOPIC = "new.message";
const GROUP_ID = "chat-message-db-writer";
const BATCH_INTERVALS_SM = 3000;

let buffer: BufferedMessage[] = [];
let flushTimer: NodeJS.Timeout | null = null;

// Initialize kafka consumer
export async function startConsumer() {
  const consumer = kafka.consumer({ groupId: GROUP_ID });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  console.log(`Kafka consumer connected and subscribed to "${TOPIC}".`);

  // Start consuming
  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      if (!message.value) return;

      try {
        const parsed: BufferedMessage = JSON.parse(message.value.toString());
        buffer.push(parsed);

        // If this is the first message in an empty array, then start the timer
        if (buffer.length === 1 && !flushTimer) {
          flushTimer = setTimeout(flushBuffereToDb, BATCH_INTERVALS_SM);
        }
      } catch (error) {
        console.log("Failed to parse kafka message:", error);
      }
    },
  });
}

// Flush the buffer to the DB and reset the timer
async function flushBuffereToDb() {
  const toInsert = buffer.splice(0, buffer.length);

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (toInsert.length === 0) return;

  try {
    const prismaPayload = toInsert.map((msg) => ({
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderType: msg.senderType,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    }));

    await prisma.message.createMany({
      data: prismaPayload,
    });

    // Redis unseen counter (only if DB insert succesfully)
    for (const msg of prismaPayload) {
      const receiverType = msg.senderType === "user" ? "seller" : "user";
      await incrementUnseenCount(receiverType, msg.conversationId);
    }
    console.log(`Flushed ${prismaPayload.length} messages to DB and Redis.`);
  } catch (error) {
    console.error("Error inserting messages to DB:", error);
    buffer.unshift(...toInsert);

    if (!flushTimer) {
      flushTimer = setTimeout(flushBuffereToDb, BATCH_INTERVALS_SM);
    }
  }
}
