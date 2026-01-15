// import { Kafka, Producer } from "kafkajs";

// export function createProducer(kafka: Kafka) {
//   const producer: Producer = kafka.producer();

//   async function connect() {
//     await producer.connect();
//   }

//   async function send(topic: string, message: object) {
//     await producer.send({
//       topic,
//       messages: [{ value: JSON.stringify(message) }],
//     });
//   }

//   async function disconnect() {
//     await producer.disconnect();
//   }

//   return { connect, send, disconnect };
// }
