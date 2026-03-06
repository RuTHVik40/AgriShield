'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scan, MapPin, Send } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import AIScanner from '@/components/scanner/AIScanner';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export default function ScannerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [location, setLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFetchingLocation(false);
        toast.success('Location captured!');
      },
      () => { toast.error('Could not get location'); setFetchingLocation(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleDetection = async (detection) => {
    if (!detection.sendAlert) return;
    
    if (!session) {
      toast.error('Sign in to send alerts');
      router.push('/auth/signin');
      return;
    }

    if (!location) {
      toast.error('Enable location to send proximity alert');
      return;
    }

    try {
      await apiClient.post('/api/alerts/pest-detected', {
        pest_name:  detection.pestName,
        confidence: detection.confidence,
        severity:   detection.severity,
        latitude:   location.lat,
        longitude:  location.lng,
      });
      toast.success('🚨 Alert sent to farmers within 5km!');
    } catch (err) {
      toast.error('Alert failed — check your connection');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary-700 flex items-center justify-center shadow-glow-green">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-800 text-white">AI Pest Scanner</h1>
              <p className="text-primary-500 text-sm">Point camera at affected crop leaf</p>
            </div>
          </div>
        </motion.div>

        {/* Location Banner */}
        {!location && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-4 mb-6 flex items-center justify-between
                       border-amber-700/30 bg-amber-900/10"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent-400" />
              <div>
                <div className="text-sm text-accent-300 font-600">Enable Location</div>
                <div className="text-xs text-accent-600">Required to send proximity alerts to nearby farmers</div>
              </div>
            </div>
            <button
              onClick={getLocation}
              disabled={fetchingLocation}
              className="btn-accent py-2 px-4 text-sm"
            >
              {fetchingLocation ? 'Getting...' : 'Enable'}
            </button>
          </motion.div>
        )}

        {location && (
          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl 
                          bg-primary-900/30 border border-primary-800/30 text-xs text-primary-400">
            <MapPin className="w-3.5 h-3.5 text-primary-400" />
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            <span className="ml-auto text-primary-600">Ready to alert</span>
          </div>
        )}

        {/* Scanner */}
        <AIScanner onDetection={handleDetection} />
      </div>
    </div>
  );
}
