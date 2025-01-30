import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# Load datasets
warehouse_data = pd.read_csv("D:/College/5thsemel/tobolt/project/data1.csv").head(5000)
sentiment_data = pd.read_csv(
    "D:/College/5thsemel/tobolt/project/market_trends_dataset.csv"
).head(5000)

print(warehouse_data.head())


class WarehousePredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.le_item = LabelEncoder()
        self.le_trend = LabelEncoder()
        # Force reload data each time
        self.data = pd.read_csv("D:/College/5thsemel/tobolt/project/data1.csv").head(
            5000
        )
        self.train_model()

    def train_model(self):
        # Debug print
        df = pd.DataFrame(self.data)
        # Encode categorical variables
        df["Item_Encoded"] = self.le_item.fit_transform(df["Item"])
        df["Market_Trend_Encoded"] = self.le_trend.fit_transform(df["Market Trend"])

        # Features for training
        X = df[["Item_Encoded", "Buy Price", "Month", "Market_Trend_Encoded"]]
        y = df["Stock in Inventory"]

        # Train the model
        self.model.fit(X, y)

    def predict(self, items, buy_prices, months, market_trends):
        # Encode input data
        items_encoded = self.le_item.transform(items)
        trends_encoded = self.le_trend.transform(market_trends)

        # Create feature matrix
        X_pred = np.column_stack((items_encoded, buy_prices, months, trends_encoded))

        # Make prediction
        prediction = self.model.predict(X_pred)
        return prediction.tolist()

    def get_item_categories(self):
        return self.le_item.classes_.tolist()

    def predict_real_time(self, items, buy_prices, months, market_trends):
        # Encode input data
        items_encoded = self.le_item.transform(items)
        trends_encoded = self.le_trend.transform(market_trends)

        # Create feature matrix
        X_pred = np.column_stack((items_encoded, buy_prices, months, trends_encoded))

        # Make prediction
        prediction = self.model.predict(X_pred)

        # Print predictions to the terminal
        print(f"Predictions: {prediction.tolist()}")

        return prediction.tolist()


class SentimentPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.le_item = LabelEncoder()
        self.le_trend = LabelEncoder()
        self.le_source = LabelEncoder()
        self.le_category = LabelEncoder()
        self.train_model()

    def train_model(self):
        df = pd.DataFrame(sentiment_data)

        # Encode categorical variables
        df["Item_Encoded"] = self.le_item.fit_transform(df["Item"])
        df["Trend_Encoded"] = self.le_trend.fit_transform(df["Trend"])
        df["Source_Encoded"] = self.le_source.fit_transform(df["Source"])
        df["Category_Encoded"] = self.le_category.fit_transform(df["Category"])

        # Convert 'Price Change' to numerical
        df["Price Change"] = df["Price Change"].str.rstrip("%").astype("float") / 100.0

        # Features for training
        X = df[
            [
                "Item_Encoded",
                "Trend_Encoded",
                "Source_Encoded",
                "Volume",
                "Price Change",
                "Category_Encoded",
            ]
        ]
        y = df["Sentiment"]

        # Train the model
        self.model.fit(X, y)

    def predict(self, items, trends, sources, volumes, price_changes, categories):
        # Encode input data
        items_encoded = self.le_item.transform(items)
        trends_encoded = self.le_trend.transform(trends)
        sources_encoded = self.le_source.transform(sources)
        categories_encoded = self.le_category.transform(categories)

        # Create feature matrix
        X_pred = np.column_stack(
            (
                items_encoded,
                trends_encoded,
                sources_encoded,
                volumes,
                price_changes,
                categories_encoded,
            )
        )

        # Make prediction
        prediction = self.model.predict(X_pred)
        return prediction.tolist()

    def get_item_categories(self):
        return self.le_item.classes_.tolist()

    def predict_real_time(
        self, items, trends, sources, volumes, price_changes, categories
    ):
        # Encode input data
        items_encoded = self.le_item.transform(items)
        trends_encoded = self.le_trend.transform(trends)
        sources_encoded = self.le_source.transform(sources)
        categories_encoded = self.le_category.transform(categories)

        # Create feature matrix
        X_pred = np.column_stack(
            (
                items_encoded,
                trends_encoded,
                sources_encoded,
                volumes,
                price_changes,
                categories_encoded,
            )
        )

        # Make prediction
        prediction = self.model.predict(X_pred)

        # Print predictions to the terminal
        print(f"Predictions: {prediction.tolist()}")

        return prediction.tolist()
