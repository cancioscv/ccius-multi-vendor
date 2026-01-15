// import { Consumer, Kafka } from "kafkajs";

// interface Topic {
//   topicName: string;
//   topicHandler: (message: any) => Promise<void>;
// }
// export function createConsumer(kafka: Kafka, groupId: string) {
//   const consumer: Consumer = kafka.consumer({ groupId });

//   async function connect() {
//     await consumer.connect();
//     console.log("Kafka consumer connected:" + groupId);
//   }

//   async function subscribe(topics: Topic[]) {
//     await consumer.subscribe({
//       topics: topics.map((topic) => topic.topicName),
//       fromBeginning: true,
//     });

//     // Read each message inside this topic
//     await consumer.run({
//       eachMessage: async ({ topic, partition, message }) => {
//         try {
//           const topicConfig = topics.find((t) => t.topicName === topic);

//           if (topicConfig) {
//             const value = message.value?.toString();

//             if (value) {
//               await topicConfig.topicHandler(JSON.parse(value));
//             }
//           }
//         } catch (err) {
//           console.log("Error processing message", err);
//         }
//       },
//     });
//   }

//   async function disconnect() {
//     await consumer.disconnect();
//   }

//   return { connect, subscribe, disconnect };
// }
// //
