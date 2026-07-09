'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scan, Bell, Users, Map, Activity,
  AlertTriangle, Calendar,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';
import { useLanguage } from '@/lib/languageContext';
import { getLocale, t } from '@/lib/translations';

const InfestationMap = dynamic(() => import('@/components/map/InfestationMap'), { ssr: false });
const API_BASE = 'http://localhost:8000';

export default function DashboardPage() {
  const { lang } = useLanguage();
  const [location, setLocation] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [stats, setStats] = useState({
    scans: 0,
    alerts: 0,
    posts: 0,
    fields: 0,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 17.385, lng: 78.4867 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setLocation({ lat: 17.385, lng: 78.4867 })
    );
  }, []);

  const fetchAlerts = async (lat, lng) => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts/nearby?lat=${lat}&lng=${lng}&radius=5000`);
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Alerts error:', error);
    }
  };

  const fetchHeatmap = async (lat, lng) => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts/heatmap?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      setHeatmap(data);
    } catch (error) {
      console.error('Heatmap error:', error);
    }
  };

  const fetchFeedStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/community/feed`);
      const data = await response.json();

      setStats((current) => ({
        ...current,
        posts: data.length,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!location) {
      return;
    }

    fetchAlerts(location.lat, location.lng);
    fetchHeatmap(location.lat, location.lng);
    fetchFeedStats();
  }, [location]);

  const severityColors = {
    critical: 'text-red-400 bg-red-900/30 border-red-700/30',
    high: 'text-accent-400 bg-amber-900/30 border-amber-700/30',
    medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-700/30',
    low: 'text-primary-400 bg-primary-900/30 border-primary-700/30',
  };

  const dynamicStats = [
    {
      label: t(lang, 'nearbyAlerts'),
      value: alerts.length,
      icon: Bell,
      delta: t(lang, 'radius5km'),
      color: 'text-red-400',
    },
    {
      label: t(lang, 'communityPosts'),
      value: stats.posts,
      icon: Users,
      delta: t(lang, 'liveFeed'),
      color: 'text-accent-400',
    },
    {
      label: t(lang, 'scans'),
      value: heatmap.length,
      icon: Scan,
      delta: t(lang, 'last30Days'),
      color: 'text-primary-400',
    },
    {
      label: t(lang, 'activeZones'),
      value: heatmap.length > 0 ? Math.ceil(heatmap.length / 10) : 0,
      icon: Map,
      delta: t(lang, 'detectedClusters'),
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="theme-heading font-display text-3xl font-800">
                {t(lang, 'welcomeToAgriShield')}
              </h1>
              <p className="theme-muted mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString(getLocale(lang), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>

            <Link href="/scanner" className="btn-primary">
              <Scan className="w-5 h-5" />
              {t(lang, 'newScan')}
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {dynamicStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="theme-muted text-xs">{stat.delta}</span>
              </div>

              <div className="theme-heading font-display text-3xl font-800 mt-1">
                {stat.value}
              </div>

              <div className="theme-muted text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass-card overflow-hidden" style={{ height: '420px' }}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--surface-border)' }}>
              <span className="theme-heading text-sm">{t(lang, 'liveInfestationMap')}</span>
            </div>

            {location && (
              <InfestationMap center={[location.lat, location.lng]} zoom={11} height="370px" />
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col" style={{ height: '420px' }}>
            <h2 className="theme-heading flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-red-400" />
              {t(lang, 'nearbyAlerts')}
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {alerts.length === 0 && (
                <p className="theme-muted text-sm">{t(lang, 'noAlertsNearby')}</p>
              )}

              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-card p-4 border ${severityColors[alert.severity]}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 mt-1" />

                    <div>
                      <div className="theme-heading text-sm">{alert.pest_name}</div>
                      <div className="theme-muted text-xs">
                        {alert.farmer_name || t(lang, 'unknown')} · {(alert.distance_m / 1000).toFixed(1)} km
                      </div>
                      <div className="text-xs mt-1">{alert.severity}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Link href="/community" className="btn-ghost w-full py-3 text-sm mt-2">
              <Activity className="w-4 h-4" />
              {t(lang, 'viewCommunity')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
