import { Redis } from "@upstash/redis";

// Extract the hostname and token from the Redis URL
const parseRedisUrl = (url: string) => {
  const parsedUrl = new URL(url);
  return {
    restUrl: `https://${parsedUrl.hostname}`,
    token: decodeURIComponent(parsedUrl.password || '')
  };
};

if (!process.env.REDIS_URL) {
  throw new Error(
    "REDIS_URL environment variable is not defined"
  );
}

const { restUrl, token } = parseRedisUrl(process.env.REDIS_URL);

console.log('Initializing Redis client with REST URL:', restUrl);

export const redis = new Redis({
  url: restUrl,
  token
});
