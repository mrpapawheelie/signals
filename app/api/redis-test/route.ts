import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Log Redis client configuration
    console.log('Redis client configuration:', {
      url: process.env.UPSTASH_REDIS_REST_URL?.substring(0, 20) + '...',
      hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
    });

    // Try a simple set operation
    console.log('Attempting to set test key...');
    const testKey = "test-key";
    const testValue = "test-value";
    
    const setResult = await redis.set(testKey, testValue);
    console.log('Set result:', setResult);

    // Try to get the value back
    console.log('Attempting to get test key...');
    const getValue = await redis.get(testKey);
    console.log('Get result:', getValue);

    // List all keys
    console.log('Attempting to list all keys...');
    const keys = await redis.keys('*');
    console.log('All keys in Redis:', keys);

    return NextResponse.json({ 
      success: true,
      operations: {
        set: {
          key: testKey,
          value: testValue,
          result: setResult
        },
        get: {
          key: testKey,
          retrieved: getValue
        },
        keys: keys
      },
      env_vars_set: {
        url: !!process.env.UPSTASH_REDIS_REST_URL,
        token: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    });
  } catch (error) {
    console.error('Redis test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : "Unknown error",
      env_vars_set: {
        url: !!process.env.UPSTASH_REDIS_REST_URL,
        token: !!process.env.UPSTASH_REDIS_REST_TOKEN
      }
    }, { status: 500 });
  }
} 