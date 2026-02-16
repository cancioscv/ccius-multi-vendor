import { kafka } from "@e-com/kafka";
import { clients } from "./main.js";

const consumer = kafka.consumer({ groupId: "log-events-groups" });
const logQueue: string[] = [];

// WebSocket processing function for logs
function processLogs() {
  if (logQueue.length === 0) return;

  console.log(`Processing ${logQueue.length} logs in batch`);
  const logs = [...logQueue];
  logQueue.length = 0;

  clients.forEach((client) => {
    logs.forEach((log) => {
      client.send(log);
    });
  });
}

setInterval(processLogs, 3000);

// Consume logs messages from kafka
export async function consumeKafkaMessages() {
  await consumer.connect();
  await consumer.subscribe({ topic: "logs", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const log = message.value.toString();
      logQueue.push(log);
    },
  });
}

// Start kafka consumer
consumeKafkaMessages().catch(console.error);
