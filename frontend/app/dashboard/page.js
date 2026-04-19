'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Scan, Bell, Users, Map, Activity,
  AlertTriangle, Calendar
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import dynamic from 'next/dynamic';

const InfestationMap = dynamic(() => import('@/components/map/InfestationMap'), { ssr: false });

const API_BASE = "http://localhost:8000";

export default function DashboardPage() {
  const router = useRouter();

  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [stats, setStats] = useState({
    scans: 0,
    alerts: 0,
    posts: 0,
    fields: 0,
  });

  // 📍 Get Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          setLocation(loc);
        },
        () => setLocation({ lat: 17.385, lng: 78.4867 }) // fallback
      );
    }
  }, []);

  // 🚨 Fetch Alerts
  const fetchAlerts = async (lat, lng) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/alerts/nearby?lat=${lat}&lng=${lng}&radius=5000`
      );
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error("Alerts error:", err);
    }
  };

  // 🌡 Fetch Heatmap
  const fetchHeatmap = async (lat, lng) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/alerts/heatmap?lat=${lat}&lng=${lng}`
      );
      const data = await res.json();
      setHeatmap(data);
    } catch (err) {
      console.error("Heatmap error:", err);
    }
  };

  // 📊 Fetch Feed (for stats)
  const fetchFeedStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/community/feed`);
      const data = await res.json();

      setStats(prev => ({
        ...prev,
        posts: data.length
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // 🚀 Load everything when location available
  useEffect(() => {
    if (!location) return;

    fetchAlerts(location.lat, location.lng);
    fetchHeatmap(location.lat, location.lng);
    fetchFeedStats();

  }, [location]);

  // 🎨 Severity styles
  const severityColors = {
    critical: 'text-red-400 bg-red-900/30 border-red-700/30',
    high: 'text-accent-400 bg-amber-900/30 border-amber-700/30',
    medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/30',
    low: 'text-primary-400 bg-primary-900/30 border-primary-700/30',
  };

  // 📊 Dynamic Stats Cards
  const dynamicStats = [
    {
      label: 'Nearby Alerts',
      value: alerts.length,
      icon: Bell,
      delta: '5km radius',
      color: 'text-red-400'
    },
    {
      label: 'Community Posts',
      value: stats.posts,
      icon: Users,
      delta: 'Live feed',
      color: 'text-accent-400'
    },
    {
      label: 'Scans',
      value: heatmap.length,
      icon: Scan,
      delta: 'Last 30 days',
      color: 'text-primary-400'
    },
    {
      label: 'Active Zones',
      value: heatmap.length > 0 ? Math.ceil(heatmap.length / 10) : 0,
      icon: Map,
      delta: 'Detected clusters',
      color: 'text-blue-400'
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-800 text-white">
                Welcome to AgriShield
              </h1>
              <p className="text-primary-500 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>

            <Link href="/scanner" className="btn-primary">
              <Scan className="w-5 h-5" />
              New Scan
            </Link>
          </div>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {dynamicStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-xs text-primary-600">{s.delta}</span>
              </div>

              <div className="font-display text-3xl font-800 text-white mt-1">
                {s.value}
              </div>

              <div className="text-primary-600 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* MAP + ALERTS */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* MAP */}
          <div className="lg:col-span-3 glass-card overflow-hidden" style={{ height: '420px' }}>
            <div className="p-4 border-b border-primary-800/30">
              <span className="text-white text-sm">Live Infestation Map</span>
            </div>

            {location && (
              <InfestationMap
                center={[location.lat, location.lng]}
                zoom={11}
                height="370px"
                heatmapData={heatmap}   // 🔥 IMPORTANT
              />
            )}
          </div>

          {/* ALERTS */}
          <div className="lg:col-span-2 flex flex-col" style={{ height: '420px' }}>

            <h2 className="text-white flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-red-400" />
              Nearby Alerts
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">

            {alerts.length === 0 && (
              <p className="text-primary-500 text-sm">No alerts nearby</p>
            )}

            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-4 border ${severityColors[alert.severity]}`}
              >

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 mt-1" />

                  <div>
                    <div className="text-white text-sm">
                      {alert.pest_name}
                    </div>

                    <div className="text-xs text-primary-500">
                      {alert.farmer_name || "Unknown"} · {(alert.distance_m / 1000).toFixed(1)} km
                    </div>

                    <div className="text-xs mt-1">
                      {alert.severity}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
            <Link href="/community" className="btn-ghost w-full py-3 text-sm mt-2">
              <Activity className="w-4 h-4" />
              View Community
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}