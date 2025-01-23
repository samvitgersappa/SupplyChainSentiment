import React from 'react';
import { SimulationSpeed } from '../types';

interface Props {
  speed: SimulationSpeed;
  onSpeedChange: (speed: SimulationSpeed) => void;
}

const speeds: SimulationSpeed[] = [
  { value: 1000, label: '1x' },
  { value: 500, label: '2x' },
  { value: 250, label: '4x' },
  { value: 125, label: '8x' }
];

export const SpeedControl: React.FC<Props> = ({ speed, onSpeedChange }) => {
  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
      <span className="text-sm font-medium text-gray-700">Simulation Speed:</span>
      <div className="flex space-x-2">
        {speeds.map((s) => (
          <button
            key={s.value}
            onClick={() => onSpeedChange(s)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
              ${speed.value === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};