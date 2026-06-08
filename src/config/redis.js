import Redis from "ioredis";

const redis = new Redis(
  process.env.REDIS_URL,
  {
    maxRetriesPerRequest: null
  }
);

console.log("REDIS_URL:", process.env.REDIS_URL);

export default redis;