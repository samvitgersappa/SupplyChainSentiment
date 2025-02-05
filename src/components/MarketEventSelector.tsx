import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface MarketEvent {
    event_id: string;
    type: 'positive' | 'negative';
    sentiment_score: number;
    price_impact: number;
    supply_impact: number;
    description: string;
}

interface EventCardProps {
    event: MarketEvent;
    isSelected: boolean;
    onSelect: (event: MarketEvent) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, isSelected, onSelect }) => {
    const isPositive = event.type === 'positive';

    return (
        <motion.button
            key={event.event_id}
            className={`
                relative p-3 rounded-lg border-2 transition-all
                ${isSelected
                    ? isPositive
                        ? 'bg-green-100 border-green-500 text-green-900'
                        : 'bg-red-100 border-red-500 text-red-900'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                }
                group focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isPositive ? 'focus:ring-green-500' : 'focus:ring-red-500'}
            `}
            onClick={() => onSelect(event)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            aria-pressed={isSelected}
            role="switch"
        >
            <div className="flex items-start gap-2">
                {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mt-1" />
                ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mt-1" />
                )}
                <div className="flex-1 text-left">
                    <h4 className="font-semibold text-sm">
                        {event.event_id.split('_').join(' ').toUpperCase()}
                    </h4>
                    <p className="text-xs mt-1 text-gray-600 group-hover:text-gray-900">
                        {event.description}
                    </p>
                </div>
            </div>
            <div className={`
                absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold
                ${isPositive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}
            `}>
                {(event.sentiment_score * 100).toFixed(0)}%
            </div>
        </motion.button>
    );
};

export const MarketEventSelector: React.FC<Props> = ({
    events,
    selectedEvent,
    onEventSelect,
}) => {
    const positiveEvents = events.filter(e => e.type === 'positive');
    const negativeEvents = events.filter(e => e.type === 'negative');

    return (
        <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Market Events</h3>
            </div>

            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Positive Events
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {positiveEvents.map((event) => (
                            <EventCard
                                key={event.event_id}
                                event={event}
                                isSelected={selectedEvent?.event_id === event.event_id}
                                onSelect={() => onEventSelect(selectedEvent?.event_id === event.event_id ? null : event)}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Negative Events
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {negativeEvents.map((event) => (
                            <EventCard
                                key={event.event_id}
                                event={event}
                                isSelected={selectedEvent?.event_id === event.event_id}
                                onSelect={() => onEventSelect(selectedEvent?.event_id === event.event_id ? null : event)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};