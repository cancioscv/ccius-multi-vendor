// import { kafka } from "@e-com/kafka";

// interface SendLogProps {
//   type?: "info" | "error" | "warning" | "success" | "debug";
//   message: string;
//   source?: string;
// }

// const producer = kafka.producer();

// // TODO: Store logs in a DB e.g. Elastic Search
// export async function sendLog({ type = "info", message, source = "unknown-service" }: SendLogProps) {
//   const logPayoad = {
//     type,
//     message,
//     timestamp: new Date().toISOString(),
//     source,
//   };

//   await producer.connect();
//   await producer.send({
//     topic: "logs",
//     messages: [{ value: JSON.stringify(logPayoad) }],
//   });

//   await producer.disconnect();
// }
