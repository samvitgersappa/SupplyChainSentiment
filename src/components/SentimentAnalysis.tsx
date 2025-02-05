import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { MarketSentiment, MarketEvent } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  sentimentData: MarketSentiment[];
  currentEvent?: MarketEvent | null;
}

const getTrendIcon = (trend?: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    default:
      return <Minus className="h-5 w-5 text-gray-500" />;
  }
};

export const SentimentAnalysis: React.FC<Props> = ({ sentimentData, currentEvent }) => {
  const calculateEventImpact = (sentiment: number): number => {
    if (!currentEvent) return sentiment;
    const impact = currentEvent.type === 'positive'
      ? 1 + currentEvent.price_impact
      : 1 - currentEvent.price_impact;
    return Math.max(0, Math.min(1, sentiment * impact));
  };

  const adjustedData = useMemo(() =>
    sentimentData.map(item => ({
      ...item,
      sentiment: calculateEventImpact(item.sentiment),
      confidence: Math.max(0, Math.min(1, (item.confidence || 0.5) +
        (currentEvent ? (currentEvent.type === 'positive' ? 0.1 : -0.1) : 0)))
    })), [sentimentData, currentEvent]);

  const getMarketStatus = (sentiment: number) => {
    if (sentiment >= 0.7) return { text: 'Bullish Market', color: 'text-green-500 dark:text-green-400' };
    if (sentiment >= 0.5) return { text: 'Stable Market', color: 'text-blue-500 dark:text-blue-400' };
    if (sentiment >= 0.3) return { text: 'Cautious Market', color: 'text-yellow-500 dark:text-yellow-400' };
    return { text: 'Bearish Market', color: 'text-red-500 dark:text-red-400' };
  };

  const getMarketRisks = (sentiment: number, trend: string) => {
    const risks = [];
    if (currentEvent?.type === 'negative') {
      risks.push(`Market impact: -${(currentEvent.price_impact * 100).toFixed(1)}%`);
    }
    if (sentiment < 0.3) risks.push('High volatility expected');
    if (trend === 'down') risks.push('Declining market confidence');
    if (sentiment > 0.8) risks.push('Potential market correction');
    return risks;
  };

  return (
    <div className="space-y-8">
      {currentEvent && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${currentEvent.type === 'positive' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            } border-2`}
        >
          <div className="flex items-center gap-2">
            <Activity className={`h-5 w-5 ${currentEvent.type === 'positive' ? 'text-green-600' : 'text-red-600'
              }`} />
            <span className="font-medium">Active Market Event:</span>
            <span className={`${currentEvent.type === 'positive' ? 'text-green-700' : 'text-red-700'
              }`}>
              {currentEvent.description}
            </span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adjustedData.map((item) => {
          const status = getMarketStatus(item.sentiment);
          const risks = getMarketRisks(item.sentiment, item.trend);

          return (
            <motion.div
              key={item.item}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold dark:text-white">{item.item}</h3>
                <motion.div
                  animate={{
                    rotate: item.trend === 'up' ? 0 : item.trend === 'down' ? 180 : 0,
                    scale: [1, 1.1, 1]
                  }}
                >
                  {getTrendIcon(item.trend)}
                </motion.div>
              </div>

              <div className="space-y-2">
                <motion.p
                  className="text-2xl font-bold dark:text-white"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {(item.sentiment * 100).toFixed(1)}%
                </motion.p>
                <p className={`text-sm font-medium ${status.color}`}>
                  {status.text}
                </p>
                {item.confidence && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Confidence Level</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${item.confidence > 0.7 ? 'bg-green-500' :
                          item.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {risks.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center text-yellow-600 dark:text-yellow-500 mb-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Risk Factors</span>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {risks.map((risk, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          • {risk}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Sentiment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={adjustedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="item" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 1]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke={currentEvent?.type === 'positive' ? '#10B981' : '#EF4444'}
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Market Impact Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adjustedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="item" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 1]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar
                dataKey="sentiment"
                fill={currentEvent?.type === 'positive' ? '#10B981' : '#EF4444'}
              />
              <Bar
                dataKey="confidence"
                fill="#6366F1"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;