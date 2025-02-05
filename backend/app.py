from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import asyncio
import numpy as np
import pandas as pd

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.SupplyChain
warehouse_collection = db.warehouses
simulation_collection = db.simulations
predictions_collection = db.predictions
events_collection = db.events
sentiment_collection = db.sentiment

# Automotive parts inventory data
AUTOMOTIVE_PARTS = {
    "Battery": {
        "price": 421.00,
        "buy_price": 41.75,
        "sell_price": 49.16,
        "trend": "bullish",
    },
    "Brakes": {
        "price": 676.00,
        "buy_price": 517.86,
        "sell_price": 642.79,
        "trend": "Neutral",
    },
    "Chassis": {
        "price": 580.00,
        "buy_price": 43.59,
        "sell_price": 51.66,
        "trend": "bullish",
    },
    "Engine": {
        "price": 299.00,
        "buy_price": 56.03,
        "sell_price": 68.69,
        "trend": "bearish",
    },
    "Exhaust": {
        "price": 430.00,
        "buy_price": 7446.61,
        "sell_price": 8806.55,
        "trend": "bullish",
    },
    "Fuel Tank": {
        "price": 448.00,
        "buy_price": 269.70,
        "sell_price": 333.90,
        "trend": "Bullish",
    },
    "Gears": {
        "price": 491.00,
        "buy_price": 6699.64,
        "sell_price": 7771.36,
        "trend": "bullish",
    },
    "Suspension": {
        "price": 353.00,
        "buy_price": 94.32,
        "sell_price": 119.53,
        "trend": "bullish",
    },
    "Transmission": {
        "price": 286.00,
        "buy_price": 193.38,
        "sell_price": 221.36,
        "trend": "Neutral",
    },
}

# Replace existing MARKET_EVENTS with expanded version

MARKET_EVENTS = {
    # Positive Events
    "technological_advancement": {
        "type": "positive",
        "sentiment_score": 0.9,
        "price_impact": -0.1,
        "supply_impact": 0.2,
        "description": "Innovation improving production efficiency",
    },
    "demand_surge": {
        "type": "positive",
        "sentiment_score": 0.7,
        "price_impact": 0.1,
        "supply_impact": 0.15,
        "description": "Increased market demand",
    },
    "trade_agreement": {
        "type": "positive",
        "sentiment_score": 0.8,
        "price_impact": -0.15,
        "supply_impact": 0.25,
        "description": "New international trade agreement reducing tariffs",
    },
    "infrastructure_upgrade": {
        "type": "positive",
        "sentiment_score": 0.75,
        "price_impact": -0.05,
        "supply_impact": 0.3,
        "description": "Major logistics infrastructure improvement",
    },
    "raw_material_surplus": {
        "type": "positive",
        "sentiment_score": 0.65,
        "price_impact": -0.2,
        "supply_impact": 0.15,
        "description": "Abundant raw material availability",
    },
    # Negative Events
    "supply_shortage": {
        "type": "negative",
        "sentiment_score": -0.8,
        "price_impact": 0.15,
        "supply_impact": -0.2,
        "description": "Supply chain disruption causing shortages",
    },
    "new_regulations": {
        "type": "negative",
        "sentiment_score": -0.4,
        "price_impact": 0.05,
        "supply_impact": -0.1,
        "description": "New regulatory requirements affecting production",
    },
    "labor_strike": {
        "type": "negative",
        "sentiment_score": -0.7,
        "price_impact": 0.2,
        "supply_impact": -0.3,
        "description": "Workers strike affecting manufacturing",
    },
    "natural_disaster": {
        "type": "negative",
        "sentiment_score": -0.9,
        "price_impact": 0.25,
        "supply_impact": -0.4,
        "description": "Natural disaster impacting production facilities",
    },
    "geopolitical_tension": {
        "type": "negative",
        "sentiment_score": -0.6,
        "price_impact": 0.1,
        "supply_impact": -0.15,
        "description": "International tensions affecting trade routes",
    },
}


class WarehousePredictionRequest(BaseModel):
    items: List[str]
    buy_prices: List[float]
    months: List[int]
    market_trends: List[str]
    market_event: str = None


class SimulationState(BaseModel):
    warehouse_id: str
    inventory: dict
    timestamp: datetime
    market_event: str = None


class SentimentData(BaseModel):
    item: str
    sentiment: float
    trend: str
    description: str


WAREHOUSES = [
    {
        "id": "1",
        "name": "Mumbai Central Hub",
        "location": "Mumbai",
        "coordinates": {"lat": 19.0760, "lng": 72.8777},
    },
    {
        "id": "2",
        "name": "Delhi Distribution Center",
        "location": "Delhi",
        "coordinates": {"lat": 28.7041, "lng": 77.1025},
    },
    {
        "id": "3",
        "name": "Bangalore Tech Hub",
        "location": "Bangalore",
        "coordinates": {"lat": 12.9716, "lng": 77.5946},
    },
    {
        "id": "4",
        "name": "Chennai Port Facility",
        "location": "Chennai",
        "coordinates": {"lat": 13.0827, "lng": 80.2707},
    },
    {
        "id": "5",
        "name": "Kolkata Eastern Center",
        "location": "Kolkata",
        "coordinates": {"lat": 22.5726, "lng": 88.3639},
    },
]


async def restore_warehouses():
    try:
        # Clear existing warehouses
        await warehouse_collection.delete_many({})

        # Initialize warehouses with automotive parts
        for warehouse in WAREHOUSES:
            inventory = []

            for item, data in AUTOMOTIVE_PARTS.items():
                stock = np.random.randint(50, 500)
                inventory_item = {
                    "item": item,
                    "stock": stock,
                    "buyPrice": data["buy_price"],
                    "sellPrice": data["sell_price"],
                    "marketCondition": data["trend"],
                    "lastUpdated": datetime.now(),
                }
                inventory.append(inventory_item)

            warehouse_doc = {
                **warehouse,
                "inventory": inventory,
                "created_at": datetime.now(),
                "last_updated": datetime.now(),
                "status": "active",
                "metrics": {
                    "utilization": round(np.random.uniform(60, 85), 2),
                    "turnover_rate": round(np.random.uniform(10, 20), 2),
                    "efficiency": round(np.random.uniform(75, 95), 2),
                },
            }

            await warehouse_collection.insert_one(warehouse_doc)

        print("Warehouses restored successfully")

    except Exception as e:
        print(f"Error restoring warehouses: {e}")
        raise e


# Create base DataFrame from AUTOMOTIVE_PARTS
df = pd.DataFrame(AUTOMOTIVE_PARTS).T.reset_index()
df.columns = ["Item", "Price", "BuyPrice", "SellPrice", "Trend"]
ACTUAL_ITEMS = df["Item"].tolist()


class WarehousePredictor:
    def predict_real_time(
        self, items, buy_prices, months, market_trends, market_event=None
    ):
        predictions = []
        for i, item in enumerate(items):
            base_prediction = np.random.normal(100, 20)
            confidence = np.random.uniform(0.7, 0.9)

            if market_event:
                event_data = MARKET_EVENTS[market_event]
                event_impact = event_data["supply_impact"]
                sentiment_impact = event_data["sentiment_score"]
                price_impact = event_data["price_impact"]

                # Fix: For negative events, reduce stock
                if event_data["type"] == "negative":
                    base_prediction *= 1 - abs(
                        event_impact
                    )  # Changed from 1 + event_impact
                    buy_prices[i] *= 1 + abs(
                        price_impact
                    )  # Increase prices for negative events
                else:
                    base_prediction *= 1 + event_impact
                    buy_prices[i] *= (
                        1 - price_impact
                    )  # Decrease prices for positive events

            predictions.append(
                {
                    "item": item,
                    "predicted_stock": max(0, int(base_prediction)),
                    "confidence": round(confidence, 2),
                    "market_trend": market_trends[i],
                    "adjusted_buy_price": round(buy_prices[i], 2),
                }
            )
        return predictions

    def calculate_utilization(self, current_stock, capacity, market_event=None):
        base_utilization = (current_stock / capacity) * 100

        if market_event:
            event_data = MARKET_EVENTS[market_event]
            supply_impact = event_data["supply_impact"]
            # Fix: Apply negative impact correctly
            if event_data["type"] == "negative":
                base_utilization *= 1 - abs(supply_impact)
            else:
                base_utilization *= 1 + supply_impact

        return min(100, max(0, round(base_utilization, 2)))


class MarketEventPredictor:
    def predict_market_impact(self, event, current_state):
        event_data = MARKET_EVENTS[event]
        return {
            "price_impact": event_data["price_impact"],
            "supply_impact": event_data["supply_impact"],
            "sentiment_score": event_data["sentiment_score"],
        }


warehouse_predictor = WarehousePredictor()
market_predictor = MarketEventPredictor()


async def init_warehouse_data():
    try:
        # Clear existing collections
        await warehouse_collection.delete_many({})
        await simulation_collection.delete_many({})
        await predictions_collection.delete_many({})
        await events_collection.delete_many({})
        await sentiment_collection.delete_many({})

        print("Initializing MongoDB collections...")

        # Initialize warehouses with automotive parts
        for warehouse in WAREHOUSES:
            inventory = []
            initial_predictions = []

            for item, data in AUTOMOTIVE_PARTS.items():
                stock = np.random.randint(50, 500)
                inventory_item = {
                    "item": item,
                    "stock": stock,
                    "buyPrice": data["buy_price"],
                    "sellPrice": data["sell_price"],
                    "marketCondition": data["trend"],
                    "lastUpdated": datetime.now(),
                }
                inventory.append(inventory_item)

                initial_predictions.append(
                    {
                        "warehouse_id": warehouse["id"],
                        "item": item,
                        "predicted_stock": stock,
                        "confidence": round(np.random.uniform(0.7, 0.9), 2),
                        "market_trend": data["trend"],
                    }
                )

            warehouse_doc = {
                **warehouse,
                "inventory": inventory,
                "created_at": datetime.now(),
                "last_updated": datetime.now(),
                "status": "active",
                "metrics": {
                    "utilization": round(np.random.uniform(60, 85), 2),
                    "turnover_rate": round(np.random.uniform(10, 20), 2),
                    "efficiency": round(np.random.uniform(75, 95), 2),
                },
            }

            await warehouse_collection.insert_one(warehouse_doc)

            initial_sim_state = {
                "warehouse_id": warehouse["id"],
                "inventory": inventory,
                "timestamp": datetime.now(),
                "status": "initialized",
                "metrics": warehouse_doc["metrics"],
            }
            await simulation_collection.insert_one(initial_sim_state)

            if initial_predictions:
                await predictions_collection.insert_many(initial_predictions)

        # Initialize market events
        for event_id, event_data in MARKET_EVENTS.items():
            event_doc = {
                "event_id": event_id,
                **event_data,
                "created_at": datetime.now(),
                "active": True,
                "last_triggered": None,
            }
            await events_collection.insert_one(event_doc)

        print("MongoDB collections initialized successfully")

    except Exception as e:
        print(f"Error initializing MongoDB collections: {e}")
        raise e


@app.on_event("startup")
async def startup_event():
    await restore_warehouses()


@app.get("/sentiment")
async def get_sentiment():
    try:
        sentiment_data = []
        for item, data in AUTOMOTIVE_PARTS.items():
            base_sentiment = 0.5
            if data["trend"].lower() == "bullish":
                sentiment = min(1.0, base_sentiment + 0.3)
            elif data["trend"].lower() == "bearish":
                sentiment = max(0.0, base_sentiment - 0.3)
            else:
                sentiment = base_sentiment

            sentiment_data.append(
                {
                    "item": item,
                    "sentiment": round(sentiment, 2),
                    "trend": data["trend"].lower(),
                    "description": f"Market trend is {data['trend'].lower()}",
                }
            )

        await sentiment_collection.insert_many(
            [{**data, "timestamp": datetime.now()} for data in sentiment_data]
        )

        return sentiment_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/market-events")
async def get_market_events():
    try:
        events = await events_collection.find({}).to_list(length=None)
        return {"events": [{**event, "_id": str(event["_id"])} for event in events]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/warehouse-data")
async def get_warehouse_data():
    try:
        warehouses = await warehouse_collection.find({}).to_list(length=None)
        return {
            "warehouses": [
                {
                    "_id": str(w["_id"]),
                    "id": w["id"],
                    "name": w["name"],
                    "location": w["location"],
                    "coordinates": w["coordinates"],
                    "inventory": w["inventory"],
                    "metrics": w["metrics"],
                }
                for w in warehouses
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict_warehouse")
async def predict_warehouse_stock(request: WarehousePredictionRequest):
    try:
        predictions = warehouse_predictor.predict_real_time(
            request.items,
            request.buy_prices,
            request.months,
            request.market_trends,
            request.market_event,
        )

        prediction_doc = {
            "predictions": predictions,
            "timestamp": datetime.now(),
            **request.dict(),
        }
        await predictions_collection.insert_one(prediction_doc)

        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()

            # Get current warehouse data
            warehouse = await warehouse_collection.find_one(
                {"id": data.get("warehouse_id", "1")}
            )

            predictions = warehouse_predictor.predict_real_time(
                data["items"],
                data["buy_prices"],
                data["months"],
                data["market_trends"],
                data.get("market_event"),
            )

            market_impact = None
            if data.get("market_event"):
                event_data = MARKET_EVENTS[data["market_event"]]
                market_impact = market_predictor.predict_market_impact(
                    data["market_event"],
                    {"prices": data["buy_prices"], "trends": data["market_trends"]},
                )

                # Update warehouse metrics based on event
                new_metrics = {
                    "utilization": warehouse_predictor.calculate_utilization(
                        sum(item["stock"] for item in warehouse["inventory"]),
                        1000,  # Assume max capacity
                        data["market_event"],
                    ),
                    "turnover_rate": round(
                        warehouse["metrics"]["turnover_rate"]
                        * (1 + event_data["supply_impact"]),
                        2,
                    ),
                    "efficiency": round(
                        warehouse["metrics"]["efficiency"]
                        * (1 + event_data["sentiment_score"] * 0.1),
                        2,
                    ),
                }

                # Update warehouse metrics
                await warehouse_collection.update_one(
                    {"id": warehouse["id"]}, {"$set": {"metrics": new_metrics}}
                )

            sim_state = {
                "warehouse_id": data.get("warehouse_id", "1"),
                "inventory": {
                    "items": data["items"],
                    "predictions": predictions,
                    "buy_prices": data["buy_prices"],
                    "market_trends": data["market_trends"],
                },
                "market_event": data.get("market_event"),
                "market_impact": market_impact,
                "timestamp": datetime.now(),
            }

            await simulation_collection.insert_one(sim_state)

            # Calculate updated sentiment data
            sentiment_data = []
            for item, item_data in AUTOMOTIVE_PARTS.items():
                base_sentiment = 0.5
                if data.get("market_event"):
                    event_sentiment = MARKET_EVENTS[data["market_event"]][
                        "sentiment_score"
                    ]
                    base_sentiment += event_sentiment * 0.3

                if item_data["trend"].lower() == "bullish":
                    sentiment = min(1.0, base_sentiment + 0.3)
                elif item_data["trend"].lower() == "bearish":
                    sentiment = max(0.0, base_sentiment - 0.3)
                else:
                    sentiment = base_sentiment

                sentiment_data.append(
                    {
                        "item": item,
                        "sentiment": round(sentiment, 2),
                        "trend": item_data["trend"].lower(),
                        "description": f"Market trend is {item_data['trend'].lower()}",
                    }
                )

            await websocket.send_json(
                {
                    "predictions": predictions,
                    "market_impact": market_impact,
                    "sentiment_data": sentiment_data,
                }
            )

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
