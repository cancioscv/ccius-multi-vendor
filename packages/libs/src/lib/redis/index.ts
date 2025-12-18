import { default as Redis } from "ioredis";
// import Redis from 'ioredis';

// const redis = new Redis({
//   host: process.env.REDIS_HOST || "127.0.0.1",
//   port: Number(process.env.REDIS_PORT) || 6379,
//   password: process.env.REDIS_PASSWORD,
// });

const redis = new Redis.default(process.env.REDIS_URL as string);

redis.set("key", "value");
export default redis;
