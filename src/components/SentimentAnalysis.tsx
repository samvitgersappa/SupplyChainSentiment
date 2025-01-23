import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { MarketSentiment } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface Props {
  sentimentData: MarketSentiment[];
}

export const SentimentAnalysis: React.FC<Props> = ({ sentimentData }) => {
  const getMarketStatus = (sentiment: number) => {
    if (sentiment >= 0.7) return { text: 'Strong Market', color: 'text-green-500 dark:text-green-400' };
    if (sentiment >= 0.5) return { text: 'Stable Market', color: 'text-blue-500 dark:text-blue-400' };
    if (sentiment >= 0.3) return { text: 'Weak Market', color: 'text-yellow-500 dark:text-yellow-400' };
    return { text: 'Bearish Market', color: 'text-red-500 dark:text-red-400' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-500 dark:text-red-400" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getMarketRisks = (sentiment: number, trend: string) => {
    const risks = [];
    if (sentiment < 0.3) risks.push('High volatility expected');
    if (trend === 'down') risks.push('Declining market confidence');
    if (sentiment > 0.8) risks.push('Potential market correction');
    return risks;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sentimentData.map((item) => {
          const status = getMarketStatus(item.sentiment);
          const risks = getMarketRisks(item.sentiment, item.trend);

          return (
            <div key={item.item} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold dark:text-white">{item.item}</h3>
                {getTrendIcon(item.trend)}
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold dark:text-white">
                  {(item.sentiment * 100).toFixed(1)}%
                </p>
                <p className={`text-sm font-medium ${status.color}`}>
                  {status.text}
                </p>
                {risks.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center text-yellow-600 dark:text-yellow-500 mb-2">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Risk Factors</span>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      {risks.map((risk, index) => (
                        <li key={index}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Sentiment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="item" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }} />
              <Legend />
              <Line type="monotone" dataKey="sentiment" stroke="#6366F1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Market Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="item" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }} />
              <Legend />
              <Bar dataKey="sentiment" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};