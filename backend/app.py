from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
from model import WarehousePredictor, SentimentPredictor
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

# Initialize predictors
warehouse_predictor = WarehousePredictor()
sentiment_predictor = SentimentPredictor()

# Load actual data
df = pd.read_csv("D:/College/5thsemel/tobolt/project/data1.csv").head(5000)
ACTUAL_ITEMS = df["Item"].unique().tolist()


class WarehousePredictionRequest(BaseModel):
    items: List[str]
    buy_prices: List[float]
    months: List[int]
    market_trends: List[str]


class SentimentPredictionRequest(BaseModel):
    items: List[str]
    trends: List[str]
    sources: List[str]
    volumes: List[int]
    price_changes: List[float]
    categories: List[str]


class SimulationState(BaseModel):
    warehouse_id: str
    inventory: dict
    timestamp: datetime


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


async def init_mongodb_collections():
    try:
        # Clear existing data
        await warehouse_collection.delete_many({})
        await simulation_collection.delete_many({})
        await predictions_collection.delete_many({})

        # Initialize warehouses with inventory
        item_stats = (
            df.groupby("Item")
            .agg({"Stock in Inventory": "mean", "Buy Price": "mean"})
            .reset_index()
        )

        for warehouse in WAREHOUSES:
            inventory = []
            initial_predictions = []

            for _, row in item_stats.iterrows():
                variation = 0.8 + np.random.random() * 0.4
                stock = int(row["Stock in Inventory"] * variation)
                buy_price = float(row["Buy Price"] * (0.9 + np.random.random() * 0.2))
                sell_price = float(buy_price * 1.2 * (0.9 + np.random.random() * 0.2))
                market_condition = np.random.choice(["Bullish", "Neutral", "Bearish"])

                inventory.append(
                    {
                        "item": row["Item"],
                        "stock": stock,
                        "buyPrice": buy_price,
                        "sellPrice": sell_price,
                        "marketCondition": market_condition,
                    }
                )

                initial_predictions.append(
                    {
                        "warehouse_id": warehouse["id"],
                        "item": row["Item"],
                        "predicted_stock": stock,
                        "buy_price": buy_price,
                        "market_trend": market_condition,
                        "timestamp": datetime.now(),
                    }
                )

            # Insert warehouse data
            warehouse_doc = {
                **warehouse,
                "inventory": inventory,
                "created_at": datetime.now(),
                "last_updated": datetime.now(),
            }
            await warehouse_collection.insert_one(warehouse_doc)

            # Insert initial predictions
            if initial_predictions:
                await predictions_collection.insert_many(initial_predictions)

            # Create initial simulation state
            await simulation_collection.insert_one(
                {
                    "warehouse_id": warehouse["id"],
                    "inventory": inventory,
                    "timestamp": datetime.now(),
                    "status": "initialized",
                }
            )

        print("MongoDB collections initialized successfully")
    except Exception as e:
        print(f"Error initializing MongoDB collections: {e}")


@app.on_event("startup")
async def startup_event():
    await init_mongodb_collections()


@app.post("/predict_warehouse")
async def predict_warehouse_stock(request: WarehousePredictionRequest):
    try:
        predictions = warehouse_predictor.predict(
            request.items, request.buy_prices, request.months, request.market_trends
        )
        result = await predictions_collection.insert_one(
            {
                "items": request.items,
                "buy_prices": request.buy_prices,
                "months": request.months,
                "market_trends": request.market_trends,
                "predictions": predictions,
                "timestamp": datetime.now(),
            }
        )
        print(f"Prediction logged with ID: {result.inserted_id}")
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict_sentiment")
async def predict_sentiment(request: SentimentPredictionRequest):
    try:
        predictions = sentiment_predictor.predict(
            request.items,
            request.trends,
            request.sources,
            request.volumes,
            request.price_changes,
            request.categories,
        )
        result = await predictions_collection.insert_one(
            {
                "type": "sentiment",
                "items": request.items,
                "trends": request.trends,
                "sources": request.sources,
                "volumes": request.volumes,
                "price_changes": request.price_changes,
                "categories": request.categories,
                "predictions": predictions,
                "timestamp": datetime.now(),
            }
        )
        print(f"Sentiment prediction logged with ID: {result.inserted_id}")
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/items")
async def get_items():
    return {"items": ACTUAL_ITEMS}


@app.post("/simulation/state")
async def save_simulation_state(state: SimulationState):
    try:
        result = await simulation_collection.insert_one(state.dict())
        print(f"Simulation state logged with ID: {result.inserted_id}")
        return {"status": "success", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/simulation/latest/{warehouse_id}")
async def get_latest_simulation_state(warehouse_id: str):
    try:
        state = await simulation_collection.find_one(
            {"warehouse_id": warehouse_id}, sort=[("timestamp", -1)]
        )
        if state:
            state["_id"] = str(state["_id"])
            return state
        return {"status": "not_found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/warehouse-data")
async def get_warehouse_data():
    try:
        warehouses = await warehouse_collection.find({}).to_list(length=None)
        for warehouse in warehouses:
            warehouse["_id"] = str(warehouse["_id"])
        return {"warehouses": warehouses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            items = data["items"]
            buy_prices = data["buy_prices"]
            months = data["months"]
            market_trends = data["market_trends"]
            warehouse_id = data.get("warehouse_id", "1")

            # Get predictions
            predictions = warehouse_predictor.predict_real_time(
                items, buy_prices, months, market_trends
            )

            current_time = datetime.now()

            # Log simulation state
            simulation_state = {
                "warehouse_id": warehouse_id,
                "inventory": {
                    "items": items,
                    "predictions": predictions,
                    "buy_prices": buy_prices,
                    "market_trends": market_trends,
                },
                "timestamp": current_time,
                "status": "running",
            }

            # Save to MongoDB
            sim_result = await simulation_collection.insert_one(simulation_state)
            print(f"Simulation state logged with ID: {sim_result.inserted_id}")

            # Log predictions
            pred_result = await predictions_collection.insert_one(
                {
                    "warehouse_id": warehouse_id,
                    "items": items,
                    "buy_prices": buy_prices,
                    "months": months,
                    "market_trends": market_trends,
                    "predictions": predictions,
                    "timestamp": current_time,
                    "simulation_id": str(sim_result.inserted_id),
                }
            )
            print(f"Prediction logged with ID: {pred_result.inserted_id}")

            # Update warehouse last_updated
            await warehouse_collection.update_one(
                {"id": warehouse_id},
                {
                    "$set": {
                        "last_updated": current_time,
                        "current_simulation": str(sim_result.inserted_id),
                    }
                },
            )

            await websocket.send_json({"predictions": predictions})
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


@app.get("/sentiment")
async def get_sentiment_data():
    sentiment_data = [
        {
            "item": "Engine",
            "sentiment": 0.8,
            "trend": "up",
            "source": "News Website",
            "volume": 1000,
            "price_change": "5%",
            "category": "Automotive",
        },
        {
            "item": "Chassis",
            "sentiment": 0.5,
            "trend": "neutral",
            "source": "News Website",
            "volume": 800,
            "price_change": "0%",
            "category": "Automotive",
        },
        {
            "item": "Exhaust",
            "sentiment": 0.3,
            "trend": "down",
            "source": "Social Media",
            "volume": 500,
            "price_change": "-10%",
            "category": "Automotive",
        },
    ]
    return sentiment_data


@app.get("/mongodb-stats")
async def get_mongodb_stats():
    try:
        warehouse_count = await warehouse_collection.count_documents({})
        simulation_count = await simulation_collection.count_documents({})
        prediction_count = await predictions_collection.count_documents({})

        return {
            "warehouses": warehouse_count,
            "simulations": simulation_count,
            "predictions": prediction_count,
            "timestamp": datetime.now(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
