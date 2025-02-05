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
  trend?: 'up' | 'down';
  impact?: number;
  confidence?: number;  // The confidence score is optional
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

export interface MarketEvent {
  event_id: string;
  type: 'positive' | 'negative';
  sentiment_score: number;
  price_impact: number;
  supply_impact: number;
  description: string;
  created_at?: Date;
  active?: boolean;
  last_triggered?: Date | null;
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