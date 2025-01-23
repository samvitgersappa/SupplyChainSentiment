import { SimulationState } from '../types';

const API_URL = 'http://localhost:8000';

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
  return response.json();
};

export const saveSimulationState = async (state: SimulationState) => {
  const response = await fetch(`${API_URL}/simulation/state`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  });
  return response.json();
};

export const getLatestSimulationState = async (warehouseId: string) => {
  const response = await fetch(`${API_URL}/simulation/latest/${warehouseId}`);
  return response.json();
};

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

export const getSentimentData = async () => {
  const response = await fetch(`${API_URL}/sentiment`);
  if (!response.ok) {
    throw new Error('Failed to fetch sentiment data');
  }
  return response.json();
};

export const getWarehouseData = async () => {
  try {
    const response = await fetch(`${API_URL}/items`);
    if (!response.ok) {
      throw new Error('Failed to fetch warehouse data');
    }
    const data = await response.json();
    console.log('Raw API response:', data); // Debug log
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const predictWarehouseStock = async (data) => {
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

export const predictSentiment = async (data) => {
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