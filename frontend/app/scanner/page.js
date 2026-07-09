'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Scan } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/ui/Navbar';
import AIScanner from '@/components/scanner/AIScanner';
import { apiClient } from '@/lib/apiClient';
import { useLanguage } from '@/lib/languageContext';
import { t } from '@/lib/translations';

export default function ScannerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { lang } = useLanguage();

  const [location, setLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t(lang, 'geolocationNotSupported'));
      return;
    }

    setFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setFetchingLocation(false);
        toast.success(t(lang, 'locationCaptured'));
      },
      () => {
        toast.error(t(lang, 'couldNotGetLocation'));
        setFetchingLocation(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleDetection = async (detection) => {
    if (!detection.triggerAlert) {
      return;
    }

    if (!session) {
      toast.error(t(lang, 'signInToSendAlerts'));
      router.push('/auth/signin');
      return;
    }

    if (!location) {
      toast.error(t(lang, 'enableLocationToSendAlert'));
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

      toast.success(t(lang, 'alertSentToNearbyFarmers'));
    } catch (error) {
      toast.error(error.message || t(lang, 'alertFailed'));
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex items-center gap-3">
            <Scan className="theme-heading" />
            <div>
              <h1 className="theme-heading text-xl font-bold">{t(lang, 'aiPestScannerTitle')}</h1>
              <p className="theme-muted text-sm">{t(lang, 'scanCropLeaves')}</p>
            </div>
          </div>
        </motion.div>

        {!location && (
          <div className="mb-6 flex justify-between items-center">
            <span className="theme-subtext text-sm">{t(lang, 'enableLocationForAlerts')}</span>
            <button onClick={getLocation} className="btn-primary">
              {fetchingLocation ? t(lang, 'getting') : t(lang, 'enable')}
            </button>
          </div>
        )}

        {location && (
          <div className="theme-subtext mb-6 text-xs">
            {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
          </div>
        )}

        <AIScanner onDetection={handleDetection} />
      </div>
    </div>
  );
}
