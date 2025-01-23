import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, TrendingUp } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navigation: React.FC<Props> = ({ isDark, onToggleTheme }) => {
  const location = useLocation();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Map className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
                Supply Chain Simulator
              </span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Link>
              <Link
                to="/sentiment"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/sentiment'
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Market Sentiment
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    </nav>
  );
};