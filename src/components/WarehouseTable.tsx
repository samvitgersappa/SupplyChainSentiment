import React, { useState, useEffect, useRef } from 'react';
import { Warehouse } from '../types';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  warehouse: Warehouse;
  marketEvent?: any;
}

interface ValueCellProps {
  value: number;
  itemKey: string;
  previousValue: number;
  isRunning: boolean;
  marketCondition?: string;
  type?: 'stock' | 'price';
}

const ValueCell: React.FC<ValueCellProps> = ({
  value,
  itemKey,
  previousValue,
  isRunning,
  marketCondition,
  type = 'price'
}) => {
  const hasIncreased = value > previousValue;
  const hasDecreased = value < previousValue;
  const [showTrend, setShowTrend] = useState(false);

  useEffect(() => {
    if (isRunning && (hasIncreased || hasDecreased)) {
      setShowTrend(true);
      const timer = setTimeout(() => setShowTrend(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [value, isRunning, hasIncreased, hasDecreased]);

  const getColor = () => {
    if (!isRunning) return '#1F2937';
    if (hasIncreased) return '#059669';
    if (hasDecreased) return '#DC2626';
    return '#1F2937';
  };

  return (
    <motion.div
      key={`${itemKey}-${value}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        color: getColor(),
        transition: { duration: 0.3 }
      }}
      className="flex items-center space-x-2"
    >
      <span className="font-medium">
        {type === 'price' ? `₹${value.toFixed(2)}` : value.toLocaleString()}
      </span>
      <AnimatePresence mode="wait">
        {showTrend && (
          <motion.span
            key={`trend-${value}`}
            initial={{ opacity: 0, y: hasIncreased ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center ${hasIncreased ? 'text-green-500' : 'text-red-500'}`}
          >
            {hasIncreased ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const WarehouseTable: React.FC<Props> = ({ warehouse, marketEvent }) => {
  const { isRunning } = useSimulation();
  const [previousValues, setPreviousValues] = useState<Record<string, number>>({});
  const [currentValues, setCurrentValues] = useState<Record<string, number>>({});
  const [marketConditions, setMarketConditions] = useState<Record<string, string>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Unique factors for each warehouse
  const locationFactor = useRef(Math.random() * 0.5 + 0.75);
  const volatilityFactor = useRef(Math.random() * 0.3 + 0.85);
  const marketSensitivity = useRef(Math.random() * 0.4 + 0.8);

  useEffect(() => {
    if (warehouse?.inventory) {
      const newValues: Record<string, number> = {};
      const newMarketConditions: Record<string, string> = {};
      warehouse.inventory.forEach(item => {
        // Apply location-based price adjustments
        const baseStock = item.stock;
        const baseBuyPrice = item.buyPrice * locationFactor.current;
        const baseSellPrice = item.sellPrice * (locationFactor.current * 1.1);

        newValues[`${warehouse.id}-${item.item}-stock`] = baseStock;
        newValues[`${warehouse.id}-${item.item}-buy`] = baseBuyPrice;
        newValues[`${warehouse.id}-${item.item}-sell`] = baseSellPrice;
        newMarketConditions[`${warehouse.id}-${item.item}`] = Math.random() > 0.5 ? 'bullish' : 'bearish';
      });
      setPreviousValues(currentValues);
      setCurrentValues(newValues);
      setMarketConditions(newMarketConditions);
    }
  }, [warehouse?.inventory]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setPreviousValues(currentValues);

        setCurrentValues(prev => {
          const updated = { ...prev };
          Object.keys(marketConditions).forEach(itemKey => {
            const isBullish = marketConditions[itemKey]?.toLowerCase() === 'bullish';
            const marketFactor = (isBullish ? 1 : -1) * marketSensitivity.current;
            const eventImpact = marketEvent ?
              (marketEvent.type === 'positive' ? 1 : -1) * marketEvent.price_impact * volatilityFactor.current : 0;

            // Stock updates
            const stockKey = `${itemKey}-stock`;
            if (updated[stockKey] !== undefined) {
              const baseChange = Math.floor((Math.random() * 8 - 3) * volatilityFactor.current);
              const stockChange = (baseChange + (eventImpact * 15)) * marketFactor;
              updated[stockKey] = Math.max(0, updated[stockKey] + stockChange);
            }

            // Price updates with warehouse-specific modifiers
            const buyKey = `${itemKey}-buy`;
            const sellKey = `${itemKey}-sell`;

            if (updated[buyKey] !== undefined) {
              const buyBaseChange = (Math.random() * 3 - 1.5) * volatilityFactor.current * marketFactor;
              const buyEventModifier = eventImpact * updated[buyKey] * 0.15;
              updated[buyKey] = Math.max(1, +(updated[buyKey] + buyBaseChange + buyEventModifier).toFixed(2));
            }

            if (updated[sellKey] !== undefined) {
              const sellBaseChange = (Math.random() * 3.5 - 1.75) * volatilityFactor.current * marketFactor;
              const sellEventModifier = eventImpact * updated[sellKey] * 0.18;
              const minSellPrice = updated[buyKey] * 1.1; // Minimum 10% markup
              updated[sellKey] = Math.max(
                minSellPrice,
                +(updated[sellKey] + sellBaseChange + sellEventModifier).toFixed(2)
              );
            }
          });
          return updated;
        });

        // Dynamic market conditions with warehouse-specific changes
        setMarketConditions(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (Math.random() > 0.9 * volatilityFactor.current) {
              const currentCondition = updated[key];
              const rand = Math.random() * marketSensitivity.current;

              if (currentCondition === 'bullish') {
                updated[key] = rand > 0.65 ? 'bearish' : 'bullish';
              } else {
                updated[key] = rand > 0.65 ? 'bullish' : 'bearish';
              }
            }
          });
          return updated;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, marketConditions, marketEvent]);

  const getMarketIcon = (condition: string = '') => {
    switch (condition.toLowerCase()) {
      case 'bullish':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'bearish':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MinusCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!warehouse || !warehouse.inventory) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800">{warehouse?.name || 'Unknown Warehouse'}</h3>
        <p className="text-sm text-gray-600">{warehouse?.location || 'Unknown Location'}</p>
        <p className="text-sm text-gray-500 mt-2">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{warehouse.name}</h3>
        <p className="text-sm text-gray-600">{warehouse.location}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {warehouse.inventory.map((item, index) => (
                <motion.tr
                  key={`${warehouse.id}-${item.item}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{item.item}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <ValueCell
                      value={currentValues[`${warehouse.id}-${item.item}-stock`] || item.stock}
                      itemKey={`${warehouse.id}-${item.item}-stock`}
                      previousValue={previousValues[`${warehouse.id}-${item.item}-stock`] || 0}
                      isRunning={isRunning}
                      marketCondition={marketConditions[`${warehouse.id}-${item.item}`]}
                      type="stock"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <ValueCell
                      value={currentValues[`${warehouse.id}-${item.item}-buy`] || item.buyPrice}
                      itemKey={`${warehouse.id}-${item.item}-buy`}
                      previousValue={previousValues[`${warehouse.id}-${item.item}-buy`] || 0}
                      isRunning={isRunning}
                      marketCondition={marketConditions[`${warehouse.id}-${item.item}`]}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <ValueCell
                      value={currentValues[`${warehouse.id}-${item.item}-sell`] || item.sellPrice}
                      itemKey={`${warehouse.id}-${item.item}-sell`}
                      previousValue={previousValues[`${warehouse.id}-${item.item}-sell`] || 0}
                      isRunning={isRunning}
                      marketCondition={marketConditions[`${warehouse.id}-${item.item}`]}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <motion.div
                      className="flex items-center"
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getMarketIcon(marketConditions[`${warehouse.id}-${item.item}`])}
                      <span className="ml-2 capitalize">
                        {marketConditions[`${warehouse.id}-${item.item}`] || 'Unknown'}
                      </span>
                    </motion.div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WarehouseTable;