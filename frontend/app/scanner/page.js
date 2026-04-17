'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scan, MapPin } from 'lucide-react';
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
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setFetchingLocation(false);
        toast.success('Location captured!');
      },
      () => {
        toast.error('Could not get location');
        setFetchingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleDetection = async (detection) => {
    // Only send alert when explicitly requested
    if (!detection.triggerAlert) return;

    if (!session) {
      toast.error('Sign in to send alerts');
      router.push('/auth/signin');
      return;
    }

    if (!location) {
      toast.error('Enable location to send alert');
      return;
    }

    try {
      await apiClient.post('/api/alerts/pest-detected', {
        pest_name: detection.pestName,
        confidence: detection.confidence,
        severity: detection.severity,
        latitude: location.lat,
        longitude: location.lng,
      });

      toast.success('🚨 Alert sent to nearby farmers!');
    } catch (err) {
      toast.error(err.message || 'Alert failed');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex items-center gap-3">
            <Scan className="text-white" />
            <div>
              <h1 className="text-xl font-bold text-white">AI Pest Scanner</h1>
              <p className="text-sm text-primary-500">Scan crop leaves</p>
            </div>
          </div>
        </motion.div>

        {/* Location */}
        {!location && (
          <div className="mb-6 flex justify-between items-center">
            <span className="text-sm text-primary-400">Enable location for alerts</span>
            <button onClick={getLocation} className="btn-primary">
              {fetchingLocation ? 'Getting...' : 'Enable'}
            </button>
          </div>
        )}

        {location && (
          <div className="mb-6 text-xs text-primary-400">
            📍 {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
          </div>
        )}

        <AIScanner onDetection={handleDetection} />
      </div>
    </div>
  );
}