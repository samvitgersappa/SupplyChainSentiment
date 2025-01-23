import React, { useState, useEffect, useRef } from 'react';
import { Warehouse } from '../types';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  warehouse: Warehouse;
}

interface ValueCellProps {
  value: number;
  itemKey: string;
  previousValue: number;
  isRunning: boolean;
  marketCondition?: string;
}

const ValueCell: React.FC<ValueCellProps> = ({ value, itemKey, previousValue, isRunning, marketCondition }) => {
  const hasIncreased = previousValue < value;
  const hasDecreased = previousValue > value;

  return (
    <motion.div
      key={`${itemKey}-${value}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        color: hasIncreased ? '#059669' : hasDecreased ? '#DC2626' : '#1F2937'
      }}
      transition={{ duration: 0.3 }}
      className="flex items-center"
    >
      ₹{value.toFixed(2)}
      {isRunning && (hasIncreased || hasDecreased) && (
        <motion.span
          initial={{ opacity: 0, x: hasIncreased ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="ml-2"
        >
          {hasIncreased ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </motion.span>
      )}
    </motion.div>
  );
};

export const WarehouseTable: React.FC<Props> = ({ warehouse }) => {
  const { isRunning } = useSimulation();
  const [previousValues, setPreviousValues] = useState<Record<string, number>>({});
  const [currentValues, setCurrentValues] = useState<Record<string, number>>({});
  const [marketConditions, setMarketConditions] = useState<Record<string, string>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (warehouse?.inventory) {
      const newValues: Record<string, number> = {};
      const newMarketConditions: Record<string, string> = {};
      warehouse.inventory.forEach(item => {
        newValues[`${item.item}-stock`] = item.stock;
        newValues[`${item.item}-buy`] = item.buyPrice;
        newValues[`${item.item}-sell`] = item.sellPrice;
        newMarketConditions[item.item] = item.marketCondition;
      });
      setPreviousValues(newValues);
      setCurrentValues(newValues);
      setMarketConditions(newMarketConditions);
    }
  }, [warehouse?.inventory]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentValues(prev => {
          const updated = { ...prev };
          Object.keys(marketConditions).forEach(item => {
            const isBullish = marketConditions[item]?.toLowerCase() === 'bullish';
            const marketFactor = isBullish ? 1 : -1;

            // Update stock
            const stockKey = `${item}-stock`;
            if (updated[stockKey] !== undefined) {
              const stockChange = (Math.random() * 3 - 1) * marketFactor;
              updated[stockKey] = Math.max(0, updated[stockKey] + Math.round(stockChange));
            }

            // Update prices
            ['buy', 'sell'].forEach(priceType => {
              const priceKey = `${item}-${priceType}`;
              if (updated[priceKey] !== undefined) {
                const priceChange = (Math.random() * 2 - 1) * marketFactor;
                updated[priceKey] = Math.max(0, +(updated[priceKey] + priceChange).toFixed(2));
              }
            });
          });
          return updated;
        });

        setMarketConditions(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (Math.random() > 0.9) {
              updated[key] = Math.random() > 0.5 ? 'bullish' : 'bearish';
            }
          });
          return updated;
        });

        setPreviousValues(currentValues);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, marketConditions, currentValues]);

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
            <AnimatePresence mode="wait">
              {warehouse.inventory.map((item, index) => (
                <motion.tr
                  key={`${warehouse.id}-${item.item}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{item.item}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <ValueCell
                      value={currentValues[`${item.item}-stock`] || item.stock}
                      itemKey={`${item.item}-stock`}
                      previousValue={previousValues[`${item.item}-stock`] || 0}
                      isRunning={isRunning}
                      marketCondition={marketConditions[item.item]}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <ValueCell
                      value={currentValues[`${item.item}-buy`] || item.buyPrice}
                      itemKey={`${item.item}-buy`}
                      previousValue={previousValues[`${item.item}-buy`] || 0}
                      isRunning={isRunning}
                      marketCondition={marketConditions[item.item]}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <ValueCell
                      value={currentValues[`${item.item}-sell`] || item.sellPrice}
                      itemKey={`${item.item}-sell`}
                      previousValue={previousValues[`${item.item}-sell`] || 0}
                      isRunning={isRunning}
                      marketCondition={marketConditions[item.item]}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <motion.div
                      className="flex items-center"
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getMarketIcon(marketConditions[item.item])}
                      <span className="ml-2">{marketConditions[item.item] || 'Unknown'}</span>
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