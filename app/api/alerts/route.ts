import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate a timestamp-based ID for the alert
    const alertId = `alert:${Date.now()}`;
    
    // Store the alert data in Redis
    if (redis) {
      await redis.set(alertId, JSON.stringify(body));
      
      // Also add to a list of alerts for easy retrieval
      await redis.lpush("alerts", alertId);
      
      // Optionally keep only last 100 alerts
      await redis.ltrim("alerts", 0, 99);
    }

    return NextResponse.json({ 
      success: true, 
      alertId,
      data: body 
    }, { status: 200 });
  } catch (error) {
    console.error("Error processing alert:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

// Get all alerts
export async function GET() {
  try {
    if (!redis) {
      return NextResponse.json({ alerts: [] }, { status: 200 });
    }

    // Get all alert IDs
    const alertIds = await redis.lrange("alerts", 0, -1);
    
    // Get all alert data
    const alerts = await Promise.all(
      alertIds.map(async (id) => {
        const data = await redis.get(id);
        return data ? JSON.parse(data) : null;
      })
    );

    return NextResponse.json({ 
      alerts: alerts.filter(Boolean)
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
} 