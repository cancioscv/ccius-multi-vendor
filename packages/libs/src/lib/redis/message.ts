import redis from "./index.js";

export async function incrementUnseenCount(receiverType: "user" | "seller", conversationId: string) {
  const key = `unseen:${receiverType}_${conversationId}`;
  await redis.incr(key);
}

export async function getUnseenCount(receiverType: "user" | "seller", conversationId: string): Promise<number> {
  const key = `unseen:${receiverType}_${conversationId}`;
  const count = await redis.get(key);
  return parseInt(count || "0");
}

export async function clearUnseenCount(receiverType: "user" | "seller", conversationId: string) {
  const key = `unseen:${receiverType}_${conversationId}`;
  await redis.del(key);
}
