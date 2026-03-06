'use client';

import { useEffect, useRef } from 'react';

// Heatmap data points: [lat, lng, intensity]
const MOCK_HEATMAP_POINTS = [
  [17.4100, 78.4700, 0.9], // Cluster 1 - high
  [17.4080, 78.4720, 0.8],
  [17.4090, 78.4710, 0.7],
  [17.3900, 78.4900, 0.6], // Cluster 2 - medium
  [17.3920, 78.4880, 0.5],
  [17.3700, 78.5000, 0.4], // Cluster 3 - low
  [17.4200, 78.5100, 0.5],
  [17.4300, 78.4600, 0.3],
  [17.3600, 78.4800, 0.6],
  [17.3850, 78.4867, 0.9], // Center point
];

const MOCK_MARKERS = [
  { lat: 17.4100, lng: 78.4700, pest: 'Tomato Late Blight', severity: 'critical', farmer: 'Ravi Kumar' },
  { lat: 17.3900, lng: 78.4900, pest: 'Spider Mites',       severity: 'medium',   farmer: 'Sunita Devi' },
  { lat: 17.3700, lng: 78.5000, pest: 'Corn Rust',          severity: 'high',     farmer: 'Ali Mohammed' },
];

export default function InfestationMap({ center = [17.385, 78.4867], zoom = 11, height = '400px' }) {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const heatLayer = useRef(null);

  useEffect(() => {
    // Dynamically import Leaflet (client-only)
    let L;
    const initMap = async () => {
      L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Fix default icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (mapObj.current) return; // Already initialized

      // Create map with dark CartoDB tiles
      mapObj.current = L.map(mapRef.current, {
        center, zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap ©CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapObj.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapObj.current);

      // Add heatmap layer using a simple canvas-based approach
      // In production, use leaflet.heat or react-leaflet-heatmap-layer-v3
      MOCK_HEATMAP_POINTS.forEach(([lat, lng, intensity]) => {
        const radius = intensity * 2000; // meters
        const color = intensity > 0.7 
          ? '#ef4444' 
          : intensity > 0.5 
            ? '#f59e0b' 
            : '#10b981';

        L.circle([lat, lng], {
          radius,
          fillColor: color,
          fillOpacity: intensity * 0.3,
          color,
          weight: 0,
        }).addTo(mapObj.current);
      });

      // Add pest markers
      MOCK_MARKERS.forEach(m => {
        const color = m.severity === 'critical' ? '#ef4444' 
                    : m.severity === 'high'     ? '#f59e0b' 
                    : '#10b981';

        const customIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 32px; height: 32px; 
              background: ${color}; 
              border: 2px solid rgba(255,255,255,0.3);
              border-radius: 50% 50% 50% 0; 
              transform: rotate(-45deg);
              box-shadow: 0 0 12px ${color}66;
            "></div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        L.marker([m.lat, m.lng], { icon: customIcon })
          .addTo(mapObj.current)
          .bindPopup(`
            <div style="
              background: #0a1a10; 
              border: 1px solid #047857; 
              border-radius: 12px; 
              padding: 12px; 
              color: #d1fae5;
              font-family: DM Sans, sans-serif;
              min-width: 160px;
            ">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${m.pest}</div>
              <div style="font-size: 12px; color: #6ee7b7;">${m.farmer}</div>
              <div style="
                display: inline-block;
                background: ${color}22;
                border: 1px solid ${color}44;
                color: ${color};
                padding: 2px 8px;
                border-radius: 100px;
                font-size: 11px;
                margin-top: 6px;
              ">${m.severity}</div>
            </div>
          `, { 
            className: 'custom-popup',
            closeButton: false,
          });
      });

      // User location marker
      L.circleMarker(center, {
        radius: 8,
        fillColor: '#10b981',
        fillOpacity: 1,
        color: '#fff',
        weight: 2,
      })
        .addTo(mapObj.current)
        .bindPopup('<div style="color: #d1fae5; background: #0a1a10; padding: 8px; border-radius: 8px;">📍 Your Location</div>');

      // Pulsing ring around user
      L.circle(center, {
        radius: 5000, // 5km radius
        color: '#047857',
        fillColor: '#047857',
        fillOpacity: 0.03,
        weight: 1,
        dashArray: '4 8',
      }).addTo(mapObj.current);
    };

    initMap().catch(console.error);

    return () => {
      if (mapObj.current) {
        mapObj.current.remove();
        mapObj.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className="leaflet-container"
    />
  );
}
