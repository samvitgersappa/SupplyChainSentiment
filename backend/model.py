import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import r2_score
import warnings

warnings.filterwarnings("ignore")

# Load dataset
warehouse_data = pd.read_csv("D:/College/5thsemel/tobolt/project/data1.csv").head(5000)

# Market events dictionary
MARKET_EVENTS = {
    # Positive Events
    "high_demand": {
        "type": "positive",
        "sentiment_score": 0.9,
        "price_impact": 0.3,
        "supply_impact": 0.4,
        "description": "Increased market demand",
    },
    "bullish_market": {
        "type": "positive",
        "sentiment_score": 0.85,
        "price_impact": 0.25,
        "supply_impact": 0.3,
        "description": "Strong stock market performance",
    },
    "export_boost": {
        "type": "positive",
        "sentiment_score": 0.8,
        "price_impact": 0.2,
        "supply_impact": 0.25,
        "description": "Increased export opportunities",
    },
    "tax_benefits": {
        "type": "positive",
        "sentiment_score": 0.75,
        "price_impact": 0.15,
        "supply_impact": 0.2,
        "description": "Government tax incentives",
    },
    # Negative Events
    "natural_disasters": {
        "type": "negative",
        "sentiment_score": 0.2,
        "price_impact": -0.3,
        "supply_impact": -0.4,
        "description": "Natural disasters impact",
    },
    "pandemic": {
        "type": "negative",
        "sentiment_score": 0.1,
        "price_impact": -0.5,
        "supply_impact": -0.6,
        "description": "Pandemic disruption",
    },
    "inflation": {
        "type": "negative",
        "sentiment_score": 0.4,
        "price_impact": -0.2,
        "supply_impact": -0.2,
        "description": "Inflation pressure",
    },
    "increased_import_duty": {
        "type": "negative",
        "sentiment_score": 0.5,
        "price_impact": -0.15,
        "supply_impact": -0.1,
        "description": "Higher import duties",
    },
    "stock_market_crash": {
        "type": "negative",
        "sentiment_score": 0.3,
        "price_impact": -0.25,
        "supply_impact": -0.3,
        "description": "Market crash impact",
    },
}


class StockPredictor:
    def __init__(self, window_size=10):
        self.window_size = window_size
        self.rf_model = RandomForestRegressor(
            n_estimators=100, max_depth=10, random_state=42
        )
        self.scaler = MinMaxScaler()
        self.le_item = LabelEncoder()
        self.le_trend = LabelEncoder()
        self.data = warehouse_data
        self.train_models()

    def calculate_moving_average(self, series):
        """Calculate simple moving average"""
        return series.rolling(window=self.window_size, min_periods=1).mean()

    def prepare_features(self, df):
        """Prepare features for model training"""
        df["Item_Encoded"] = self.le_item.fit_transform(df["Item"])
        df["Market_Trend_Encoded"] = self.le_trend.fit_transform(df["Market Trend"])

        features = np.column_stack(
            (
                df["Item_Encoded"],
                df["Buy Price"],
                df["Month"],
                df["Market_Trend_Encoded"],
            )
        )

        return self.scaler.fit_transform(features)

    def train_models(self):
        """Train the prediction models"""
        df = pd.DataFrame(self.data)

        # Prepare features
        features = self.prepare_features(df)
        target = df["Stock in Inventory"].values

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )

        # Train Random Forest
        self.rf_model.fit(X_train, y_train)

        # Calculate moving averages for each item
        self.item_mas = {}
        for item in df["Item"].unique():
            item_data = df[df["Item"] == item]["Stock in Inventory"]
            self.item_mas[item] = self.calculate_moving_average(item_data)

    def predict(self, items, buy_prices, months, market_trends):
        """Make predictions using ensemble approach"""
        # Prepare input data
        items_encoded = self.le_item.transform(items)
        trends_encoded = self.le_trend.transform(market_trends)

        input_data = np.column_stack(
            (items_encoded, buy_prices, months, trends_encoded)
        )

        # Scale input
        scaled_input = self.scaler.transform(input_data)

        # RF prediction
        rf_predictions = self.rf_model.predict(scaled_input)

        # MA predictions
        ma_predictions = np.zeros(len(items))
        for i, item in enumerate(items):
            if item in self.item_mas:
                ma_predictions[i] = self.item_mas[item].iloc[-1]
            else:
                ma_predictions[i] = rf_predictions[i]

        # Ensemble predictions (weighted average)
        final_predictions = 0.7 * rf_predictions + 0.3 * ma_predictions

        return final_predictions.tolist()

    def visualize_model_performance(self):
        """Generate visualization plots for model performance"""
        # Prepare data
        df = pd.DataFrame(self.data)
        features = self.prepare_features(df)
        actual = df["Stock in Inventory"].values
        predicted = self.rf_model.predict(features)

        # Create a figure with subplots
        fig = plt.figure(figsize=(15, 10))

        # 1. Scatter plot of actual vs predicted
        plt.subplot(2, 2, 1)
        plt.scatter(actual, predicted, alpha=0.5)
        plt.plot(
            [actual.min(), actual.max()], [actual.min(), actual.max()], "r--", lw=2
        )
        plt.xlabel("Actual Stock")
        plt.ylabel("Predicted Stock")
        plt.title(f"Actual vs Predicted (R² = {r2_score(actual, predicted):.3f})")

        # 2. Feature importance plot
        plt.subplot(2, 2, 2)
        feature_importance = pd.DataFrame(
            {
                "feature": ["Item", "Buy Price", "Month", "Market Trend"],
                "importance": self.rf_model.feature_importances_,
            }
        )
        sns.barplot(x="importance", y="feature", data=feature_importance)
        plt.title("Feature Importance")

        # 3. Time series plot for a sample item
        plt.subplot(2, 2, 3)
        sample_item = df["Item"].unique()[0]
        item_data = df[df["Item"] == sample_item]
        plt.plot(item_data.index, item_data["Stock in Inventory"], label="Actual")
        plt.plot(item_data.index, self.item_mas[sample_item], label="Moving Average")
        plt.title(f"Stock Timeline for {sample_item}")
        plt.legend()

        # 4. Distribution plot
        plt.subplot(2, 2, 4)
        sns.kdeplot(actual, label="Actual")
        sns.kdeplot(predicted, label="Predicted")
        plt.title("Distribution of Actual vs Predicted Values")
        plt.legend()

        plt.tight_layout()
        plt.savefig("model_performance.png")
        plt.close()


class WarehousePredictor:
    def __init__(self):
        self.model = StockPredictor()
        self.data = warehouse_data

    def predict_real_time(self, items, buy_prices, months, market_trends, event=None):
        """Make real-time predictions with market event impacts"""
        base_prediction = self.model.predict(items, buy_prices, months, market_trends)

        if event and event in MARKET_EVENTS:
            event_data = MARKET_EVENTS[event]
            impact = event_data["supply_impact"]

            if event_data["type"] == "positive":
                adjusted_prediction = [p * (1 + abs(impact)) for p in base_prediction]
            else:
                adjusted_prediction = [p * (1 - abs(impact)) for p in base_prediction]

            return adjusted_prediction

        return base_prediction


class MarketEventPredictor:
    def __init__(self):
        self.events = MARKET_EVENTS

    def get_event_impact(self, event_name):
        """Get impact details for a specific event"""
        if event_name in self.events:
            return self.events[event_name]
        return None

    def predict_market_impact(self, event_name, current_values):
        """Predict market impact for given event"""
        if event_name not in self.events:
            return current_values

        impact = self.events[event_name]
        return {
            "type": impact["type"],
            "sentiment": impact["sentiment_score"],
            "price_impact": impact["price_impact"],
            "description": impact["description"],
        }

    def get_events_by_type(self, event_type="all"):
        """Get events filtered by type"""
        if event_type == "all":
            return self.events
        return {k: v for k, v in self.events.items() if v["type"] == event_type}


if __name__ == "__main__":
    predictor = WarehousePredictor()
    predictor.model.visualize_model_performance()
    print("Model initialized and performance plots generated successfully")
