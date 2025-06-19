#!/bin/bash

# Sample TradingView alert data
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "exchange": "BINANCE",
    "symbol": "BTCUSDT",
    "alert_name": "BTC Price Alert",
    "alert_type": "price_cross",
    "price": 50000,
    "time": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "bar": {
      "open": 49950,
      "high": 50100,
      "low": 49900,
      "close": 50000,
      "volume": 100
    },
    "strategy": {
      "position_size": 1,
      "order_action": "buy",
      "order_contracts": 1,
      "order_price": 50000,
      "order_id": "test_order",
      "market_position": "long",
      "market_position_size": 1,
      "prev_market_position": "flat",
      "prev_market_position_size": 0
    }
}' 