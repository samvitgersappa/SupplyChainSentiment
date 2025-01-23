import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import { icon, LatLngExpression } from 'leaflet';
import { Truck, Clock, AlertTriangle } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { Warehouse } from '../types';
import 'leaflet/dist/leaflet.css';

interface Props {
    warehouses: Warehouse[];
    simulatedStock: number;
}

interface Route {
    id: string;
    from: Warehouse;
    to: Warehouse;
    distance: number;
    eta: number;
    traffic: 'low' | 'medium' | 'high';
    status: 'active' | 'delayed' | 'completed';
}

const defaultIcon = icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateETA = (distance: number, traffic: 'low' | 'medium' | 'high'): number => {
    const baseSpeed = 60; // km/h
    const trafficFactors = { low: 1, medium: 1.3, high: 1.8 };
    return distance / baseSpeed * trafficFactors[traffic];
};

const getRouteStyle = (route: Route) => ({
    color: route.status === 'delayed' ? '#EF4444' :
        route.status === 'active' ? '#10B981' : '#6B7280',
    weight: route.traffic === 'high' ? 4 : route.traffic === 'medium' ? 3 : 2,
    opacity: 0.8,
    dashArray: route.status === 'delayed' ? '5, 10' : undefined
});

export const EnhancedWarehouseMap: React.FC<Props> = ({ warehouses = [], simulatedStock = 0 }) => {
    const { isRunning } = useSimulation();
    const [routes, setRoutes] = useState<Route[]>([]);
    const center: LatLngExpression = [20.5937, 78.9629];

    const updateRouteStatus = (route: Route): Route => {
        const random = Math.random();
        const progressFactor = isRunning ? (Math.random() - 0.5) * 0.2 : 0;
        const newEta = Math.max(0.1, route.eta * (1 + progressFactor));

        let newStatus = route.status;
        if (random > 0.95) newStatus = 'delayed';
        else if (random > 0.7) newStatus = 'active';
        else if (newEta < 0.5) newStatus = 'completed';

        const trafficChange = Math.random();
        let newTraffic = route.traffic;
        if (trafficChange > 0.9) newTraffic = 'high';
        else if (trafficChange > 0.6) newTraffic = 'medium';
        else if (trafficChange > 0.3) newTraffic = 'low';

        return {
            ...route,
            eta: newEta,
            status: newStatus,
            traffic: newTraffic
        };
    };

    useEffect(() => {
        if (!warehouses.length) return;

        const newRoutes = warehouses.flatMap((w1, i) =>
            warehouses.slice(i + 1).map(w2 => {
                const distance = calculateDistance(w1.latitude, w1.longitude, w2.latitude, w2.longitude);
                const traffic = Math.random() > 0.7 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low';
                const eta = calculateETA(distance, traffic);

                return {
                    id: `route-${w1.id}-${w2.id}`,
                    from: w1,
                    to: w2,
                    distance,
                    eta,
                    traffic,
                    status: Math.random() > 0.7 ? 'delayed' : Math.random() > 0.3 ? 'active' : 'completed'
                };
            })
        );

        setRoutes(newRoutes);
    }, [warehouses]);

    useEffect(() => {
        if (!isRunning) return;

        const intervalId = setInterval(() => {
            setRoutes(prevRoutes => prevRoutes.map(updateRouteStatus));
        }, 2000);

        return () => clearInterval(intervalId);
    }, [isRunning]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Active Deliveries
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                        {routes.filter(r => r.status === 'active').length}
                    </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Delayed Routes
                    </h3>
                    <p className="text-2xl font-bold text-red-600">
                        {routes.filter(r => r.status === 'delayed').length}
                    </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Average ETA
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                        {(routes.reduce((acc, r) => acc + r.eta, 0) / routes.length || 0).toFixed(1)}h
                    </p>
                </div>
            </div>

            <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                    center={center}
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {routes.map((route) => (
                        <Polyline
                            key={route.id}
                            positions={[
                                [route.from.latitude, route.from.longitude],
                                [route.to.latitude, route.to.longitude]
                            ]}
                            pathOptions={getRouteStyle(route)}
                        >
                            <Tooltip permanent>
                                <div className="text-sm font-medium">
                                    <div>Distance: {route.distance.toFixed(1)} km</div>
                                    <div className={`font-bold ${route.status === 'delayed' ? 'text-red-600' :
                                            route.status === 'active' ? 'text-green-600' : 'text-gray-600'
                                        }`}>
                                        ETA: {route.eta.toFixed(1)}h
                                    </div>
                                    <div className={`capitalize ${route.traffic === 'high' ? 'text-red-600' :
                                            route.traffic === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                        Traffic: {route.traffic}
                                    </div>
                                    <div className="capitalize">Status: {route.status}</div>
                                </div>
                            </Tooltip>
                        </Polyline>
                    ))}

                    {warehouses.map((warehouse) => (
                        <Marker
                            key={warehouse.id}
                            position={[warehouse.latitude, warehouse.longitude]}
                            icon={defaultIcon}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold">{warehouse.name}</h3>
                                    <p>Stock: {warehouse.inventory?.reduce((sum, item) => sum + item.stock, 0)}</p>
                                    <p>Active Routes: {routes.filter(r =>
                                        r.from.id === warehouse.id || r.to.id === warehouse.id
                                    ).length}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Route Status</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-green-500 mr-2"></div>
                            <span>Active Route</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-red-500 mr-2"></div>
                            <span>Delayed Route</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-0.5 bg-gray-500 mr-2"></div>
                            <span>Completed Route</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Traffic Conditions</h3>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <div className="w-4 h-1 bg-green-500 mr-2"></div>
                            <span>Low Traffic</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-2 bg-yellow-500 mr-2"></div>
                            <span>Medium Traffic</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-4 h-3 bg-red-500 mr-2"></div>
                            <span>High Traffic</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};