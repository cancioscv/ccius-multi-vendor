import { createKafkaClient, createProducer } from "@e-com/kafka";

const kafka = createKafkaClient("auth-service");

export const producer = createProducer(kafka);
