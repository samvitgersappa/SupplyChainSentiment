import React, { createContext, useState, useContext, useEffect } from 'react';
import { SimulationState } from '../types';
import { connectWebSocket } from '../services/api';

interface SimulationContextProps {
    isRunning: boolean;
    setIsRunning: (isRunning: boolean) => void;
    simulationState: SimulationState | null;
    setSimulationState: (state: SimulationState | null) => void;
}

const SimulationContext = createContext<SimulationContextProps | undefined>(undefined);

export const SimulationProvider: React.FC = ({ children }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [simulationState, setSimulationState] = useState<SimulationState | null>(null);

    useEffect(() => {
        if (isRunning) {
            const socket = connectWebSocket((data) => {
                setSimulationState(data);
            });

            return () => {
                socket.close();
            };
        }
    }, [isRunning]);

    return (
        <SimulationContext.Provider value={{ isRunning, setIsRunning, simulationState, setSimulationState }}>
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