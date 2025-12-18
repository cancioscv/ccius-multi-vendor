import { default as Redis } from "ioredis";
// import Redis from 'ioredis';

// const redis = new Redis({
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: Number(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD,
// });

const redis = new Redis.default(process.env.REDIS_URL!);

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("connect", () => console.log("Connected to Redis!"));
redis.on("reconnecting", () => console.log("Reconnecting to Redis..."));

export default redis;
