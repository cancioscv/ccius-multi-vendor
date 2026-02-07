import {
  //  createConsumer,
  createKafkaClient,
  createProducer,
} from "@e-com/kafka";

const kafkaClient = createKafkaClient("chat-service");

export const producer = createProducer(kafkaClient);
// export const consumer = createConsumer(kafkaClient, "chat-message-db-writer");
