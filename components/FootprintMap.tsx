import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import { WalkRecord } from '../types';
import { Filter } from 'lucide-react';

interface Props {
  records: WalkRecord[];
}

type FilterType = 'week' | 'month' | 'all';

const FootprintMap: React.FC<Props> = ({ records }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [filter, setFilter] = useState<FilterType>('week');

  // Helper to check date range
  const filterRecords = (allRecords: WalkRecord[]) => {
    const now = new Date();
    return allRecords.filter(record => {
      // Only show records with coordinates
      if (!record.routeCoordinates || record.routeCoordinates.length === 0) return false;

      const recordDate = new Date(record.startTime);
      if (filter === 'all') return true;
      
      if (filter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= oneWeekAgo;
      }
      
      if (filter === 'month') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return recordDate >= oneMonthAgo;
      }
      return true;
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center (Taipei or user location could be better, but we rely on fitting bounds)
    const map = L.map(mapContainerRef.current).setView([25.0330, 121.5654], 13);

    // Use CartoDB Positron for that "Zakka" / Japanese minimalist paper look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers when records or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear previous layers
    layerGroup.clearLayers();

    const filtered = filterRecords(records);

    if (filtered.length === 0) {
        // Handle empty state visually if needed, or just keep map empty
        return;
    }

    const bounds = L.latLngBounds([]);

    // Create a custom Shiba Icon
    // Using a divIcon with emoji for simplicity and performance without external images
    const shibaIcon = L.divIcon({
        html: '<div style="font-size: 24px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));">🐕</div>',
        className: 'bg-transparent',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -10]
    });

    filtered.forEach(record => {
      if (!record.routeCoordinates || record.routeCoordinates.length === 0) return;

      const latlngs = record.routeCoordinates.map(c => [c.latitude, c.longitude] as [number, number]);
      
      // Extend bounds
      latlngs.forEach(pt => bounds.extend(pt));

      // Draw Path
      const polyline = L.polyline(latlngs, {
        color: '#f97316', // Tailwind orange-500
        weight: 4,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroup);

      // Add Marker at the end
      const endPoint = latlngs[latlngs.length - 1];
      const dateStr = new Date(record.startTime).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
      const duration = Math.floor(record.durationSeconds / 60);

      const popupContent = `
        <div class="font-sans p-3 min-w-[150px]">
          <div class="font-bold text-orange-600 border-b border-orange-100 pb-1 mb-2 flex justify-between items-center">
             <span>${dateStr}</span>
             <span class="text-xs text-stone-400 font-normal">${duration} mins</span>
          </div>
          <div class="text-sm text-stone-600 space-y-1">
             <div>mood: ${record.mood}</div>
             <div>💩: ${record.hasPooped ? '有產出' : '無'}</div>
             <div class="text-xs text-stone-400 mt-2 truncate max-w-[180px]">${record.notes || ''}</div>
          </div>
        </div>
      `;

      L.marker(endPoint, { icon: shibaIcon })
        .addTo(layerGroup)
        .bindPopup(popupContent);
        
      // Also bind popup to the line itself
      polyline.bindPopup(popupContent);
    });

    // Fit map to show all routes
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [records, filter]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Filter Control - Floating Top */}
      <div className="absolute top-4 left-0 right-0 z-[400] px-4 flex justify-center">
        <div className="bg-white/90 backdrop-blur-md shadow-md rounded-full p-1 flex items-center gap-1 border border-stone-200">
           <Filter className="w-4 h-4 ml-2 text-stone-400" />
           {['week', 'month', 'all'].map((f) => (
             <button
               key={f}
               onClick={() => setFilter(f as FilterType)}
               className={`
                 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                 ${filter === f 
                   ? 'bg-stone-800 text-white shadow-sm' 
                   : 'text-stone-500 hover:bg-stone-100'}
               `}
             >
               {f === 'week' ? '本週' : f === 'month' ? '本月' : '全部'}
             </button>
           ))}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="flex-1 w-full bg-stone-100 z-0"
        style={{ minHeight: '300px' }}
      >
        {/* Leaflet injects here */}
      </div>

      {/* Empty State Overlay if no routes */}
      {filterRecords(records).length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[401]">
            <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg text-center border border-stone-100">
               <div className="text-4xl mb-2">🗺️</div>
               <p className="text-stone-600 font-bold">目前沒有路線資料</p>
               <p className="text-stone-400 text-xs mt-1">請試著切換日期或使用「自動紀錄」功能</p>
            </div>
         </div>
      )}
    </div>
  );
};

export default FootprintMap;