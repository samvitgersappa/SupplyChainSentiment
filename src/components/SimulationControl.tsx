import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Props {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export const SimulationControl: React.FC<Props> = ({ isRunning, onToggle, onReset }) => {
  return (
    <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <button
        onClick={onToggle}
        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isRunning
            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
        }`}
      >
        {isRunning ? (
          <>
            <Pause className="h-4 w-4 mr-2" />
            Pause Simulation
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Start Simulation
          </>
        )}
      </button>
      <button
        onClick={onReset}
        className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset
      </button>
    </div>
  );
};