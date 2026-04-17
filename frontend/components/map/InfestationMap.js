'use client';

import { useEffect, useRef, useState } from 'react';
import { alertsApi } from '@/lib/apiClient';

export default function InfestationMap({
  center = [17.385, 78.4867],
  zoom = 11,
  height = '400px',
}) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);

  const [location, setLocation] = useState({
    lat: center[0],
    lng: center[1],
  });

  // ── Get User Location ──
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        console.warn('Location access denied, using default');
      }
    );
  }, []);

  // ── Initialize Map ──
  useEffect(() => {
    let L;

    const initMap = async () => {
      L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (mapObj.current) return;

      mapObj.current = L.map(mapRef.current, {
        center: [location.lat, location.lng],
        zoom,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(mapObj.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapObj.current);

      // ── Load Data ──
      loadAlerts(L);
    };

    const loadAlerts = async (L) => {
      try {
        const [nearbyRes, heatmapRes] = await Promise.all([
          alertsApi.getNearby(location.lat, location.lng),
          alertsApi.getHeatmap(location.lat, location.lng),
        ]);

        const markers = nearbyRes.data;
        const heatmap = heatmapRes.data;

        // ── Heatmap (circles) ──
        heatmap.forEach((p) => {
          const intensity = p.intensity;

          const color =
            intensity > 0.7
              ? '#ef4444'
              : intensity > 0.5
              ? '#f59e0b'
              : '#10b981';

          L.circle([p.lat, p.lng], {
            radius: intensity * 2000,
            fillColor: color,
            fillOpacity: intensity * 0.3,
            color,
            weight: 0,
          }).addTo(mapObj.current);
        });

        // ── Markers ──
        markers.forEach((m) => {
          const color =
            m.severity === 'critical'
              ? '#ef4444'
              : m.severity === 'high'
              ? '#f59e0b'
              : '#10b981';

          const icon = L.divIcon({
            className: '',
            html: `
              <div style="
                width: 32px; height: 32px;
                background: ${color};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 0 12px ${color}66;
              "></div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });

          L.marker([m.latitude, m.longitude], { icon })
            .addTo(mapObj.current)
            .bindPopup(`
              <div style="
                background: #0a1a10;
                border-radius: 10px;
                padding: 10px;
                color: #d1fae5;
              ">
                <div style="font-weight:600">${m.pest_name}</div>
                <div style="font-size:12px">${m.farmer_name || 'Unknown'}</div>
                <div style="color:${color}; font-size:12px">${m.severity}</div>
              </div>
            `);
        });

        // ── User Marker ──
        L.circleMarker([location.lat, location.lng], {
          radius: 8,
          fillColor: '#10b981',
          fillOpacity: 1,
          color: '#fff',
          weight: 2,
        }).addTo(mapObj.current);

      } catch (err) {
        console.error('Map data error:', err);
      }
    };

    initMap();

    return () => {
      if (mapObj.current) {
        mapObj.current.remove();
        mapObj.current = null;
      }
    };
  }, [location]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className="rounded-xl"
    />
  );
}