import React, { createContext, useContext, useState, useEffect } from 'react';
import { Warehouse, MarketEvent } from '../types';

interface Metrics {
    historicalPriceTrends: number;
    tradingVolumeAnalysis: number;
    marketEventsImpact: number;
    supplyChainMetrics: number;
    technicalIndicators: number;
    confidence: number;
}

interface SimulationContextProps {
    isRunning: boolean;
    setIsRunning: (isRunning: boolean) => void;
    simulationState: any;
    currentMarketEvent: MarketEvent | null;
    setCurrentMarketEvent: (event: MarketEvent | null) => void;
    metrics: Metrics;
    setMetrics: (metrics: Metrics) => void;
    warehouses: Warehouse[];
    setWarehouses: (warehouses: Warehouse[]) => void;
    currentStock: number;
    setCurrentStock: (stock: number) => void;
}

const SimulationContext = createContext<SimulationContextProps | undefined>(undefined);

export const SimulationProvider: React.FC = ({ children }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [simulationState, setSimulationState] = useState<any>(null);
    const [currentMarketEvent, setCurrentMarketEvent] = useState<MarketEvent | null>(null);
    const [metrics, setMetrics] = useState<Metrics>({
        historicalPriceTrends: 0,
        tradingVolumeAnalysis: 0,
        marketEventsImpact: 0,
        supplyChainMetrics: 0,
        technicalIndicators: 0,
        confidence: 0
    });
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [currentStock, setCurrentStock] = useState(0);

    return (
        <SimulationContext.Provider
            value={{
                isRunning,
                setIsRunning,
                simulationState,
                currentMarketEvent,
                setCurrentMarketEvent,
                metrics,
                setMetrics,
                warehouses,
                setWarehouses,
                currentStock,
                setCurrentStock,
            }}
        >
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (!context) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
};