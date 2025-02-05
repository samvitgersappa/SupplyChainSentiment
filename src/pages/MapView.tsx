import React, { useState, useEffect } from 'react';
import { EnhancedWarehouseMap } from '../components/EnhancedWarehouseMap';
import { SpeedControl } from '../components/SpeedControl';
import { SimulationControl } from '../components/SimulationControl';
import { WarehouseTable } from '../components/WarehouseTable';
import { MarketEventSelector } from '../components/MarketEventSelector';
import { Warehouse, SimulationSpeed } from '../types';
import { useSimulation } from '../context/SimulationContext';
import { getWarehouseData, getMarketEvents } from '../services/api';
import { motion } from 'framer-motion';
import { useEvent } from '../context/EventContext';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Boxes,
  ShoppingCart,
  BarChart,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Props {
  warehouses: Warehouse[];
  simulatedStock: number;
  speed: SimulationSpeed;
  onSpeedChange: (speed: SimulationSpeed) => void;
}

export const MapView: React.FC<Props> = ({
  warehouses = [],
  simulatedStock = 0,
  speed,
  onSpeedChange
}) => {
  const { selectedEvent, setSelectedEvent } = useEvent();
  const { isRunning, setIsRunning, simulationState } = useSimulation();
  const [currentWarehouses, setCurrentWarehouses] = useState<Warehouse[]>(warehouses);
  const [currentStock, setCurrentStock] = useState(simulatedStock);
  const [previousStock, setPreviousStock] = useState(simulatedStock);
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    totalValue: calculateInitialValue(warehouses),
    orderRate: 50,
    utilization: calculateUtilization(simulatedStock),
    turnoverRate: 15,
    avgProcessingTime: 45,
    totalOrders: 1200,
    capacityUsed: 75,
    lastUpdated: Date.now(),
    marketImpact: 0
  });

  function calculateInitialValue(warehouses: Warehouse[]): number {
    return warehouses.reduce((acc, w) =>
      acc + (w.inventory?.reduce((sum, item) =>
        sum + (item.stock * (item.sellPrice || 0)), 0) || 0), 0);
  }

  function calculateUtilization(stock: number): number {
    const maxCapacity = 10000;
    return Math.min(100, (stock / maxCapacity) * 100);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [warehouseData, eventsData] = await Promise.all([
          getWarehouseData(),
          getMarketEvents()
        ]);

        setCurrentWarehouses(warehouseData.warehouses);
        setMarketEvents(eventsData.events);
        setError(null);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  function calculateTotalStock(warehouses: Warehouse[]): number {
    return warehouses.reduce((total, warehouse) => {
      return total + warehouse.inventory.reduce((warehouseTotal, item) => {
        return warehouseTotal + item.stock;
      }, 0);
    }, 0);
  }

  useEffect(() => {
    if (isRunning) {
      const timer = setInterval(() => {
        setCurrentWarehouses(prevWarehouses => {
          const updatedWarehouses = prevWarehouses.map(warehouse => ({
            ...warehouse,
            inventory: warehouse.inventory.map(item => {
              const stockChange = Math.floor((Math.random() - 0.5) * 10);
              return {
                ...item,
                stock: Math.max(0, item.stock + stockChange)
              };
            })
          }));

          const newTotalStock = calculateTotalStock(updatedWarehouses);

          const adjustedStock = selectedEvent?.type === 'negative'
            ? Math.floor(newTotalStock * (1 - Math.abs(selectedEvent.supply_impact)))
            : selectedEvent?.type === 'positive'
              ? Math.floor(newTotalStock * (1 + selectedEvent.supply_impact))
              : newTotalStock;

          setPreviousStock(currentStock);
          setCurrentStock(adjustedStock);

          setMetrics(prev => ({
            ...prev,
            totalValue: calculateInitialValue(updatedWarehouses),
            utilization: calculateUtilization(adjustedStock),
            orderRate: Math.floor(45 + Math.random() * 20),
            turnoverRate: Math.floor(10 + Math.random() * 10),
            lastUpdated: Date.now()
          }));

          return updatedWarehouses;
        });
      }, speed === 'fast' ? 500 : speed === 'slow' ? 2000 : 1000);

      return () => clearInterval(timer);
    }
  }, [isRunning, selectedEvent, currentStock, speed]);

  const handleReset = () => {
    setCurrentWarehouses(warehouses);
    setIsRunning(false);
    setCurrentStock(simulatedStock);
    setPreviousStock(simulatedStock);
    setSelectedEvent(null);
    setMetrics({
      totalValue: calculateInitialValue(warehouses),
      orderRate: 50,
      utilization: calculateUtilization(simulatedStock),
      turnoverRate: 15,
      avgProcessingTime: 45,
      totalOrders: 1200,
      capacityUsed: 75,
      lastUpdated: Date.now(),
      marketImpact: 0
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <SpeedControl speed={speed} onSpeedChange={onSpeedChange} />
          <SimulationControl
            isRunning={isRunning}
            onToggle={() => setIsRunning(!isRunning)}
            onReset={handleReset}
          />
        </div>
      </div>

      <MarketEventSelector
        events={marketEvents}
        selectedEvent={selectedEvent}
        onEventSelect={setSelectedEvent}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className={`bg-white p-4 rounded-lg shadow-lg ${currentStock > previousStock ? 'bg-green-50' : 'bg-red-50'
            }`}
          animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
        >
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Total Stock</p>
              <h3 className="text-2xl font-bold">{currentStock.toLocaleString()}</h3>
            </div>
            <Package className={currentStock > previousStock ? 'text-green-500' : 'text-red-500'} />
          </div>
          {isRunning && (
            <div className="flex items-center mt-2">
              {currentStock > previousStock ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${currentStock > previousStock ? 'text-green-600' : 'text-red-600'
                }`}>
                {Math.abs(currentStock - previousStock).toLocaleString()} units
              </span>
            </div>
          )}
        </motion.div>

        <motion.div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Market Impact</p>
              <h3 className="text-2xl font-bold">
                {selectedEvent ? (
                  <span className={selectedEvent.type === 'positive' ? 'text-green-600' : 'text-red-600'}>
                    {(selectedEvent.sentiment_score * 100).toFixed(1)}%
                  </span>
                ) : 'No Event'}
              </h3>
            </div>
            <AlertTriangle className={`${selectedEvent?.type === 'positive' ? 'text-green-500' : 'text-red-500'
              }`} />
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Processing Time</p>
              <h3 className="text-2xl font-bold">{metrics.avgProcessingTime} min</h3>
            </div>
            <Clock className="text-purple-500" />
          </div>
          <div className="mt-2 text-sm text-purple-600">
            {metrics.totalOrders.toLocaleString()} total orders
          </div>
        </motion.div>

        <motion.div className="bg-white p-4 rounded-lg shadow-lg">
          <div className="flex justify-between">
            <div>
              <p className="text-gray-500">Utilization</p>
              <h3 className="text-2xl font-bold">{metrics.utilization.toFixed(1)}%</h3>
            </div>
            <Boxes className="text-orange-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <motion.div
              className="bg-orange-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${metrics.utilization}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      </div>

      <section>
        <EnhancedWarehouseMap
          warehouses={currentWarehouses}
          simulatedStock={currentStock}
          selectedEvent={selectedEvent}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentWarehouses.map(warehouse => (
          <WarehouseTable
            key={`warehouse-table-${warehouse.id || warehouse.name}`}
            warehouse={warehouse}
            marketEvent={selectedEvent}
          />
        ))}
      </section>
    </div>
  );
};