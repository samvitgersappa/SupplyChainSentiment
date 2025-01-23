from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import uvicorn
from model import WarehousePredictor, SentimentPredictor
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import asyncio

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
db = client.supply_chain
warehouse_collection = db.warehouses
simulation_collection = db.simulations

# Initialize predictors
warehouse_predictor = WarehousePredictor()
sentiment_predictor = SentimentPredictor()


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


@app.post("/predict_warehouse")
async def predict_warehouse_stock(request: WarehousePredictionRequest):
    try:
        predictions = warehouse_predictor.predict(
            request.items, request.buy_prices, request.months, request.market_trends
        )
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
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/items")
async def get_items():
    return {"items": warehouse_predictor.get_item_categories()}


@app.post("/simulation/state")
async def save_simulation_state(state: SimulationState):
    try:
        await simulation_collection.insert_one(state.dict())
        return {"status": "success"}
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
            predictions = warehouse_predictor.predict_real_time(
                items, buy_prices, months, market_trends
            )

            # Print predictions to the terminal
            print(f"WebSocket Predictions: {predictions}")

            await websocket.send_json({"predictions": predictions})
            await asyncio.sleep(1)  # Adjust the interval as needed
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


@app.get("/sentiment")
async def get_sentiment_data():
    # Replace with actual sentiment data retrieval logic
    sentiment_data = [
        {
            "item": "Rice",
            "sentiment": 0.8,
            "trend": "up",
            "source": "News Website",
            "volume": 1000,
            "price_change": "5%",
            "category": "Commodity",
        },
        {
            "item": "Wheat",
            "sentiment": 0.5,
            "trend": "neutral",
            "source": "News Website",
            "volume": 800,
            "price_change": "0%",
            "category": "Commodity",
        },
        {
            "item": "Electronics",
            "sentiment": 0.3,
            "trend": "down",
            "source": "Social Media",
            "volume": 500,
            "price_change": "-10%",
            "category": "Technology",
        },
        {
            "item": "Sugar",
            "sentiment": 0.6,
            "trend": "up",
            "source": "News Website",
            "volume": 1200,
            "price_change": "3%",
            "category": "Commodity",
        },
        {
            "item": "Fruit",
            "sentiment": 0.4,
            "trend": "neutral",
            "source": "News Website",
            "volume": 600,
            "price_change": "-2%",
            "category": "Commodity",
        },
        {
            "item": "Oil",
            "sentiment": 0.2,
            "trend": "down",
            "source": "News Website",
            "volume": 1500,
            "price_change": "-8%",
            "category": "Commodity",
        },
    ]
    return sentiment_data


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
