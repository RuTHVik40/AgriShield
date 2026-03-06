'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Scan, Bell, Users, Map, Activity, 
  AlertTriangle, CheckCircle, TrendingUp, Calendar
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import dynamic from 'next/dynamic';

const InfestationMap = dynamic(() => import('@/components/map/InfestationMap'), { ssr: false });

const mockAlerts = [
  { id: 1, pest: 'Tomato Late Blight', severity: 'critical', distance: '1.2km', time: '10 min ago', farmer: 'Ravi Kumar' },
  { id: 2, pest: 'Spider Mites',        severity: 'medium',   distance: '3.8km', time: '45 min ago', farmer: 'Sunita Devi' },
  { id: 3, pest: 'Corn Rust',           severity: 'high',     distance: '4.1km', time: '2 hrs ago',  farmer: 'Mohammed Ali' },
];

const mockStats = [
  { label: 'Total Scans',    value: '142',   icon: Scan,     delta: '+12 today',  color: 'text-primary-400' },
  { label: 'Active Alerts',  value: '3',     icon: Bell,     delta: 'In 5km zone', color: 'text-red-400' },
  { label: 'Community Posts', value: '28',   icon: Users,    delta: '+4 today',   color: 'text-accent-400' },
  { label: 'Fields Monitored', value: '7',  icon: Map,      delta: '847 acres',  color: 'text-blue-400' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 17.385, lng: 78.4867 }) // Default: Hyderabad
      );
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const severityColors = {
    critical: 'text-red-400 bg-red-900/30 border-red-700/30',
    high:     'text-accent-400 bg-amber-900/30 border-amber-700/30',
    medium:   'text-yellow-400 bg-yellow-900/30 border-yellow-700/30',
    low:      'text-primary-400 bg-primary-900/30 border-primary-700/30',
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl font-800 text-white">
                Good morning, {session?.user?.name?.split(' ')[0] || 'Farmer'} 👋
              </h1>
              <p className="text-primary-500 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Link href="/scanner" className="btn-primary">
              <Scan className="w-5 h-5" />
              New Scan
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {mockStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="stat-card"
            >
              <div className="flex items-center justify-between">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span className="text-xs text-primary-600 font-mono">{s.delta}</span>
              </div>
              <div className="font-display text-3xl font-800 text-white mt-1">{s.value}</div>
              <div className="text-primary-600 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Map + Alerts grid */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Map */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 glass-card p-0 overflow-hidden"
            style={{ height: '420px' }}
          >
            <div className="p-4 border-b border-primary-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-primary-400" />
                <span className="font-display font-700 text-white text-sm">Live Infestation Map</span>
              </div>
              <Link href="/community" className="text-xs text-primary-500 hover:text-primary-300 transition-colors">
                Full map →
              </Link>
            </div>
            {location && (
              <InfestationMap
                center={[location.lat, location.lng]}
                zoom={11}
                height="370px"
              />
            )}
          </motion.div>

          {/* Alerts Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-700 text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-400" />
                Nearby Alerts
              </h2>
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <div className="radar-ping bg-red-500 w-2 h-2" />
              </div>
            </div>

            {mockAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.5 }}
                className={`glass-card p-4 border ${severityColors[alert.severity]}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 
                                            ${alert.severity === 'critical' ? 'text-red-400' : 
                                              alert.severity === 'high' ? 'text-accent-400' : 'text-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-600 text-white text-sm truncate">{alert.pest}</div>
                    <div className="text-xs text-primary-500 mt-0.5">
                      {alert.farmer} · {alert.distance}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge text-xs ${severityColors[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-primary-600">{alert.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <Link href="/community" className="btn-ghost w-full py-3 text-sm">
              <Activity className="w-4 h-4" />
              View All Activity
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
