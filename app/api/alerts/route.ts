import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

interface TradingViewAlert {
  exchange?: string;
  ticker?: string;
  close?: number;
  volume?: number;
  time?: string;
  timenow?: string;
  interval?: string;
  bar?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  };
  strategy?: {
    position_size?: number;
    order_action?: string;
    order_contracts?: number;
    order_price?: number;
    order_id?: string;
    market_position?: string;
    market_position_size?: number;
    prev_market_position?: string;
    prev_market_position_size?: number;
  };
}

/**
 * Example TradingView Alert Message Format:
 * JSON: {"exchange":"{{exchange}}", "ticker":"{{ticker}}", "price":{{close}}, "volume":{{volume}}}
 * Text: Exchange={{exchange}}, Symbol={{ticker}}, Price={{close}}, Volume={{volume}}
 */
function parseTradingViewAlert(text: string): TradingViewAlert {
  // First try to parse as JSON
  try {
    const jsonData = JSON.parse(text);
    return jsonData;
  } catch {
    // If not JSON, try to parse variables from text format
    const alert: TradingViewAlert = {};

    // Extract values using regex
    const exchangeMatch = text.match(/exchange[=:]?\s*([^,}\s]+)/i);
    const tickerMatch = text.match(/(?:ticker|symbol)[=:]?\s*([^,}\s]+)/i);
    const closeMatch = text.match(/(?:close|price)[=:]?\s*([\d.]+)/i);
    const volumeMatch = text.match(/volume[=:]?\s*([\d.]+)/i);

    if (exchangeMatch) alert.exchange = exchangeMatch[1];
    if (tickerMatch) alert.ticker = tickerMatch[1];
    if (closeMatch) alert.close = parseFloat(closeMatch[1]);
    if (volumeMatch) alert.volume = parseFloat(volumeMatch[1]);

    // Add bar data if available
    if (closeMatch || text.includes('{{open}}') || text.includes('{{high}}') || text.includes('{{low}}')) {
      alert.bar = {
        close: closeMatch ? parseFloat(closeMatch[1]) : undefined,
      };
    }

    return alert;
  }
}

export async function POST(request: Request) {
  try {
    let alertData: TradingViewAlert;
    const contentType = request.headers.get('content-type');
    console.log('Received alert webhook. Content-Type:', contentType);

    // Handle different content types
    if (contentType?.includes('application/json')) {
      alertData = await request.json();
    } else {
      // Handle TradingView text alerts
      const textBody = await request.text();
      console.log('Received text body:', textBody);
      alertData = parseTradingViewAlert(textBody);
    }

    // Enrich the data
    const enrichedData = {
      ...alertData,
      received_at: new Date().toISOString(),
      source: 'tradingview',
      raw_alert: contentType?.includes('application/json') ? 
        JSON.stringify(alertData) : 
        await request.text()
    };

    console.log('Processed alert:', JSON.stringify(enrichedData, null, 2));
    
    // Generate a timestamp-based ID for the alert
    const alertId = `alert:${Date.now()}`;
    
    // Store the alert data in Redis
    await redis.set(alertId, JSON.stringify(enrichedData));
    
    // Add to list of alerts
    await redis.lpush("alerts", alertId);
    
    // Keep only last 100 alerts
    await redis.ltrim("alerts", 0, 99);

    return NextResponse.json({ 
      success: true, 
      alertId,
      data: enrichedData
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
    // Get all alert IDs
    const alertIds = await redis.lrange("alerts", 0, -1);
    
    if (!alertIds || alertIds.length === 0) {
      return NextResponse.json({ alerts: [] }, { status: 200 });
    }
    
    // Get all alert data
    const alerts = await Promise.all(
      alertIds.map(async (id) => {
        try {
          const data = await redis.get<string>(id);
          if (!data) return null;
          return {
            id,
            ...JSON.parse(data)
          };
        } catch (error) {
          console.error(`Error fetching alert ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out any null values and sort by timestamp
    const validAlerts = alerts
      .filter(Boolean)
      .sort((a, b) => 
        new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
      );
    
    return NextResponse.json({ 
      alerts: validAlerts,
      meta: {
        total: alertIds.length,
        valid: validAlerts.length
      }
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