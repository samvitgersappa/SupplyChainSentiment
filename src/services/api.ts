import { SimulationState, MarketEvent } from '../types';

const API_URL = 'http://localhost:8000';

// Warehouse Operations
export const getWarehouseData = async () => {
  try {
    const response = await fetch(`${API_URL}/warehouse-data`);
    if (!response.ok) {
      throw new Error('Failed to fetch warehouse data');
    }
    const data = await response.json();
    console.log('Warehouse data:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const predictWarehouseStock = async (data: {
  items: string[];
  buy_prices: number[];
  months: number[];
  market_trends: string[];
  market_event?: string;
}) => {
  const response = await fetch(`${API_URL}/predict_warehouse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to predict warehouse stock');
  }
  return response.json();
};

// Simulation Operations
export const saveSimulationState = async (state: SimulationState) => {
  const response = await fetch(`${API_URL}/simulation/state`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  });
  if (!response.ok) {
    throw new Error('Failed to save simulation state');
  }
  return response.json();
};

export const getLatestSimulationState = async (warehouseId: string) => {
  const response = await fetch(`${API_URL}/simulation/latest/${warehouseId}`);
  if (!response.ok) {
    throw new Error('Failed to get latest simulation state');
  }
  return response.json();
};

// Market Events Operations
// Update the getMarketEvents function
export const getMarketEvents = async () => {
  try {
    const response = await fetch(`${API_URL}/market-events`);
    if (!response.ok) {
      throw new Error('Failed to fetch market events');
    }
    const data = await response.json();
    return {
      events: data.events.map((event: any) => ({
        ...event,
        price_impact: parseFloat(event.price_impact),
        supply_impact: parseFloat(event.supply_impact),
        sentiment_score: parseFloat(event.sentiment_score)
      }))
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Sentiment Operations
export const getSentimentData = async () => {
  const response = await fetch(`${API_URL}/sentiment`);
  if (!response.ok) {
    throw new Error('Failed to fetch sentiment data');
  }
  return response.json();
};

export const predictSentiment = async (data: {
  items: string[];
  trends: string[];
  sources: string[];
  volumes: number[];
  price_changes: number[];
  categories: string[];
}) => {
  const response = await fetch(`${API_URL}/predict_sentiment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to predict sentiment');
  }
  return response.json();
};

// WebSocket Operations
export const connectWebSocket = (onMessage: (data: any) => void) => {
  const socket = new WebSocket('ws://localhost:8000/ws/simulation');

  socket.onopen = () => {
    console.log('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return socket;
};

export const createWebSocket = (url: string) => {
  const socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('WebSocket connection opened');
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return socket;
};

// Helper Functions
export const predictStock = async (
  items: string[],
  buyPrices: number[],
  months: number[],
  marketTrends: string[]
) => {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      buy_prices: buyPrices,
      months,
      market_trends: marketTrends,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to predict stock');
  }
  return response.json();
};