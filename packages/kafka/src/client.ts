import { Kafka } from "kafkajs";

// Use different broker addresses for Docker vs local development
// const getBrokers = () => {
//   if (process.env.NODE_ENV === "production" || process.env.DOCKER_ENV === "true") {
//     // Inside Docker containers, use service name
//     return [process.env.KAFKA_BROKERS || "kafka:29092"];
//   } else {
//     // Local development, use localhost
//     return [process.env.KAFKA_BROKERS || "localhost:9092"];
//   }
// };
export function createKafkaClient(service: string) {
  return new Kafka({
    clientId: service,
    brokers: ["localhost:9097", "localhost:9098", "localhost:9099"],

    // brokers: getBrokers(),
  });
}

export const kafka = new Kafka({
  clientId: "kafka-service",
  brokers: ["localhost:9097", "localhost:9098", "localhost:9099"],
});
