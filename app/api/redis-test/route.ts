import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try to set a test value
    const testKey = "test:" + Date.now();
    const testValue = "Hello from Redis at " + new Date().toISOString();
    
    console.log('Testing Redis connection...');
    console.log('Redis URL:', process.env.UPSTASH_REDIS_REST_URL);
    console.log('Redis Token exists:', !!process.env.UPSTASH_REDIS_REST_TOKEN);
    
    await redis.set(testKey, testValue);
    const retrieved = await redis.get(testKey);
    
    return NextResponse.json({ 
      success: true,
      test_key: testKey,
      test_value: testValue,
      retrieved_value: retrieved,
      env_vars_set: {
        url: !!process.env.UPSTASH_REDIS_REST_URL,
        token: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      env_vars_set: {
        url: !!process.env.UPSTASH_REDIS_REST_URL,
        token: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    }, { status: 500 });
  }
} 