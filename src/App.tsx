import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { MapView } from './pages/MapView';
import { SentimentView } from './pages/SentimentView';
import { Warehouse, MarketSentiment, SimulationSpeed } from './types';

function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const [warehouses] = useState<Warehouse[]>([
    {
      id: '1',
      name: 'Mumbai Hub',
      location: 'Maharashtra',
      latitude: 19.0760,
      longitude: 72.8777,
      inventory: [
        { item: 'Wheat', stock: 75, buyPrice: 53, sellPrice: 54.3, month: 3, marketCondition: 'Neutral' },
        { item: 'Rice', stock: 80, buyPrice: 32, sellPrice: 36.69, month: 10, marketCondition: 'Bullish' }
      ]
    },
    {
      id: '2',
      name: 'Delhi Center',
      location: 'Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      inventory: [
        { item: 'Wheat', stock: 742, buyPrice: 53, sellPrice: 43.32, month: 7, marketCondition: 'Bearish' },
        { item: 'Sugar', stock: 764, buyPrice: 43, sellPrice: 44.19, month: 4, marketCondition: 'Neutral' }
      ]
    },
    {
      id: '3',
      name: 'Bangalore Depot',
      location: 'Karnataka',
      latitude: 12.9716,
      longitude: 77.5946,
      inventory: [
        { item: 'Rice', stock: 624, buyPrice: 36, sellPrice: 33.48, month: 9, marketCondition: 'Bearish' },
        { item: 'Electronics', stock: 275, buyPrice: 8679, sellPrice: 7426.08, month: 1, marketCondition: 'Bearish' }
      ]
    },
    {
      id: '4',
      name: 'Kolkata Hub',
      location: 'West Bengal',
      latitude: 22.5726,
      longitude: 88.3639,
      inventory: [
        { item: 'Rice', stock: 520, buyPrice: 34, sellPrice: 35.8, month: 5, marketCondition: 'Neutral' },
        { item: 'Sugar', stock: 430, buyPrice: 41, sellPrice: 43.5, month: 8, marketCondition: 'Bullish' }
      ]
    },
    {
      id: '5',
      name: 'Chennai Center',
      location: 'Tamil Nadu',
      latitude: 13.0827,
      longitude: 80.2707,
      inventory: [
        { item: 'Electronics', stock: 180, buyPrice: 8450, sellPrice: 8890, month: 2, marketCondition: 'Bullish' },
        { item: 'Wheat', stock: 320, buyPrice: 51, sellPrice: 53.8, month: 6, marketCondition: 'Neutral' }
      ]
    }
  ]);

  const [sentimentData] = useState<MarketSentiment[]>([
    { item: 'Wheat', sentiment: 0.6, trend: 'down' },
    { item: 'Rice', sentiment: 0.8, trend: 'up' },
    { item: 'Electronics', sentiment: 0.3, trend: 'down' },
    { item: 'Sugar', sentiment: 0.5, trend: 'stable' }
  ]);

  const [simulatedStock, setSimulatedStock] = useState<number>(0);
  const [speed, setSpeed] = useState<SimulationSpeed>({ value: 1000, label: '1x' });

  useEffect(() => {
    const interval = setInterval(() => {
      const baseStock = warehouses.reduce((total, warehouse) => 
        total + warehouse.inventory.reduce((sum, item) => sum + item.stock, 0), 0);
      const variation = Math.sin(Date.now() / 10000) * 100;
      setSimulatedStock(Math.round(baseStock + variation));
    }, speed.value);

    return () => clearInterval(interval);
  }, [speed.value, warehouses]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <Navigation isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Routes>
              <Route 
                path="/" 
                element={
                  <MapView 
                    warehouses={warehouses}
                    simulatedStock={simulatedStock}
                    speed={speed}
                    onSpeedChange={setSpeed}
                  />
                } 
              />
              <Route 
                path="/sentiment" 
                element={<SentimentView sentimentData={sentimentData} />} 
              />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;