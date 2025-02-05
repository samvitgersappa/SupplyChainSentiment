import React, { useState, useEffect } from 'react';
import { SentimentAnalysis } from '../components/SentimentAnalysis';
import { MarketSentiment } from '../types';
import {
  TrendingUp, Play, Pause, BarChart2, PieChart, LineChart,
  Activity, AlertTriangle, DollarSign, BarChart as BarChartIcon
} from 'lucide-react';
import { getSentimentData } from '../services/api';
import { useSimulation } from '../context/SimulationContext';
import { motion } from 'framer-motion';
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  Legend
} from 'recharts';

const CHART_COLORS = {
  primary: {
    positive: ['#059669', '#34D399', '#6EE7B7', '#A7F3D0'],
    negative: ['#DC2626', '#F87171', '#FCA5A5', '#FEE2E2'],
    neutral: ['#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB']
  }
};

interface ChartData {
  name: string;
  value: number;
}

interface MarketCorrelation {
  x: number;
  y: number;
  name: string;
}

interface RiskMetric {
  subject: string;
  value: number;
  fullMark: number;
}

export interface MarketEvent {
  type: 'positive' | 'negative';
  sentiment_score: number;
  description: string;
  price_impact: number;
}

export interface MarketSentiment {
  item: string;
  sentiment: number;
  trend?: 'up' | 'down';
  impact?: number;
  confidence?: number;
}

interface EventIndicatorProps {
  event: MarketEvent;
}

export const SentimentView: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<MarketSentiment[]>([]);
  const [historicalData, setHistoricalData] = useState<ChartData[]>([]);
  const [distributionData, setDistributionData] = useState<ChartData[]>([]);
  const [marketCorrelation, setMarketCorrelation] = useState<MarketCorrelation[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<ChartData[]>([]);
  const { isRunning, setIsRunning, simulationState, currentMarketEvent } = useSimulation();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSentimentData();
        setSentimentData(data);

        // Initialize all chart data
        setHistoricalData(generateHistoricalData());
        setDistributionData(generateDistributionData(data));
        setMarketCorrelation(generateMarketCorrelation());
        setRiskMetrics(generateRiskMetrics());
        setImpactAnalysis(generateImpactAnalysis());
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
      }
    };
    fetchData();
  }, []);

  const applyMarketEventImpact = (value: number) => {
    if (!currentMarketEvent) return value;
    const impact = currentMarketEvent.type === 'positive' ? 1 + currentMarketEvent.price_impact : 1 - currentMarketEvent.price_impact;
    return value * impact;
  };

  const generateHistoricalData = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      name: `Month ${i + 1}`,
      value: applyMarketEventImpact(Math.random() * 100)
    }));
  };

  const generateDistributionData = (data: MarketSentiment[]) => {
    return [
      { name: 'Bullish', value: applyMarketEventImpact(30) },
      { name: 'Neutral', value: applyMarketEventImpact(40) },
      { name: 'Bearish', value: applyMarketEventImpact(30) }
    ];
  };

  const generateMarketCorrelation = () => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: applyMarketEventImpact(Math.random() * 100),
      y: applyMarketEventImpact(Math.random() * 100),
      name: `Factor ${i + 1}`
    }));
  };

  const generateRiskMetrics = () => {
    return [
      { subject: 'Volatility', value: applyMarketEventImpact(Math.random() * 100), fullMark: 100 },
      { subject: 'Market Risk', value: applyMarketEventImpact(Math.random() * 100), fullMark: 100 },
      { subject: 'Liquidity', value: applyMarketEventImpact(Math.random() * 100), fullMark: 100 },
      { subject: 'Sentiment', value: applyMarketEventImpact(Math.random() * 100), fullMark: 100 },
      { subject: 'Technical', value: applyMarketEventImpact(Math.random() * 100), fullMark: 100 }
    ];
  };

  const generateImpactAnalysis = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      name: `Day ${i + 1}`,
      value: applyMarketEventImpact(Math.random() * 100)
    }));
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning) {
      intervalId = setInterval(() => {
        setSentimentData(prevData =>
          prevData.map(item => ({
            ...item,
            sentiment: Math.max(0.1, Math.min(1, applyMarketEventImpact(item.sentiment + (Math.random() - 0.5) * 0.1))),
            trend: Math.random() > 0.5 ? 'up' : 'down'
          }))
        );

        setHistoricalData(prev => {
          const newData = [...prev.slice(1), { name: 'New', value: applyMarketEventImpact(Math.random() * 100) }];
          return newData.map((item, index) => ({ ...item, name: `Month ${index + 1}` }));
        });

        setDistributionData(prev =>
          prev.map(item => ({
            ...item,
            value: Math.max(10, Math.min(60, applyMarketEventImpact(item.value + (Math.random() - 0.5) * 10)))
          }))
        );

        setMarketCorrelation(prev =>
          prev.map(item => ({
            ...item,
            x: Math.max(0, Math.min(100, applyMarketEventImpact(item.x + (Math.random() - 0.5) * 10))),
            y: Math.max(0, Math.min(100, applyMarketEventImpact(item.y + (Math.random() - 0.5) * 10)))
          }))
        );

        setRiskMetrics(prev =>
          prev.map(item => ({
            ...item,
            value: Math.max(0, Math.min(100, applyMarketEventImpact(item.value + (Math.random() - 0.5) * 10)))
          }))
        );

        setImpactAnalysis(prev =>
          prev.map(item => ({
            ...item,
            value: Math.max(0, Math.min(100, applyMarketEventImpact(item.value + (Math.random() - 0.5) * 10)))
          }))
        );
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, currentMarketEvent]);

  useEffect(() => {
    if (currentMarketEvent) {
      setHistoricalData(generateHistoricalData());
      setDistributionData(generateDistributionData(sentimentData));
      setMarketCorrelation(generateMarketCorrelation());
      setRiskMetrics(generateRiskMetrics());
      setImpactAnalysis(generateImpactAnalysis());
    }
  }, [currentMarketEvent]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex items-center">
          <TrendingUp className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-2xl font-bold dark:text-white">Market Sentiment Analysis</h2>
        </div>

        <motion.div
          className={`flex items-center px-4 py-2 rounded-full ${isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
          animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: isRunning ? Infinity : 0 }}
        >
          {isRunning ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              <span className="font-medium">Simulation Running</span>
              {currentMarketEvent && (
                <span className="ml-2 text-sm">
                  • {currentMarketEvent.description}
                  <span className={`ml-1 ${currentMarketEvent.type === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    ({currentMarketEvent.type === 'positive' ? '+' : '-'}
                    {(currentMarketEvent.price_impact * 100).toFixed(1)}%)
                  </span>
                </span>
              )}
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              <span className="font-medium">Simulation Paused</span>
            </>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          className="bg-white p-4 rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-indigo-600" />
            Historical Trends
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </RechartsLine>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-4 rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
            Sentiment Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-4 rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-indigo-600" />
            Risk Assessment
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskMetrics}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Risk"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-4 rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChartIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Market Correlation
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="Factor Impact" />
                <YAxis type="number" dataKey="y" name="Market Response" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Correlation" data={marketCorrelation} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="bg-white p-4 rounded-lg shadow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
            Market Impact Analysis
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={impactAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <section>
        <SentimentAnalysis sentimentData={sentimentData} />
      </section>
    </div>
  );
};