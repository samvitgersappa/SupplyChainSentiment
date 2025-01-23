import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Warehouse } from '../types';
import { icon } from 'leaflet';

const defaultIcon = icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface Props {
  warehouses: Warehouse[];
  simulatedStock: number;
}

export const WarehouseMap: React.FC<Props> = ({ warehouses = [], simulatedStock = 0 }) => {
  if (!Array.isArray(warehouses)) {
    return <div className="bg-white p-6 rounded-lg shadow-lg">Loading warehouse data...</div>;
  }

  const center: [number, number] = [20.5937, 78.9629];

  const validWarehouses = warehouses.filter(w =>
    w && typeof w.latitude === 'number' && typeof w.longitude === 'number'
  );

  const connections = validWarehouses.flatMap((w1, i) =>
    validWarehouses.slice(i + 1).map(w2 => ({
      positions: [[w1.latitude, w1.longitude], [w2.latitude, w2.longitude]] as [number, number][]
    }))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Warehouse Network Map</h2>
      <div className="mb-4">
        <p className="text-lg font-semibold">
          Simulated Total Stock: {simulatedStock.toLocaleString()}
        </p>
      </div>
      <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {connections.map((connection, i) => (
            <Polyline
              key={`connection-${i}`}
              positions={connection.positions}
              color="#4F46E5"
              weight={2}
              opacity={0.5}
            />
          ))}

          {validWarehouses.map((warehouse) => (
            <Marker
              key={`warehouse-${warehouse.id}`}
              position={[warehouse.latitude, warehouse.longitude]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{warehouse.name}</h3>
                  <p className="text-sm">{warehouse.location}</p>
                  {warehouse.inventory && warehouse.inventory.length > 0 && (
                    <div className="mt-2">
                      <h4 className="font-semibold">Inventory:</h4>
                      <ul className="text-sm">
                        {warehouse.inventory.map((item) => (
                          <li key={`${warehouse.id}-${item.item}`}>
                            {item.item}: {item.stock} units
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};