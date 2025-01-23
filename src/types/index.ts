export interface InventoryItem {
  item: string;
  stock: number;
  buyPrice: number;
  sellPrice: number;
  month: number;
  marketCondition: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  inventory: InventoryItem[];
}

export interface MarketSentiment {
  item: string;
  sentiment: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SimulationSpeed {
  value: number;
  label: string;
}

export interface SimulationState {
  warehouse_id: string;
  inventory: Record<string, number>;
  timestamp: Date;
}

export const connectWebSocket = (onMessage: (data: any) => void) => {
  const socket = new WebSocket('ws://localhost:8000/ws/simulation');

  socket.onopen = () => {
    console.log('WebSocket connection established');
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return socket;
};