import { Redis } from "@upstash/redis";

if (!process.env.REDIS_URL) {
  throw new Error(
    "REDIS_URL environment variable is not defined"
  );
}

// Parse Redis URL to get the token and URL
const redisUrl = new URL(process.env.REDIS_URL);
const token = redisUrl.username + ":" + redisUrl.password;

// For Upstash, we need to convert rediss://hostname:port to https://hostname
const url = `https://${redisUrl.hostname}`;

console.log('Initializing Redis client with secure connection...');

export const redis = new Redis({
  url,
  token
});
