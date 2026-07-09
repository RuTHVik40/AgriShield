'use client';

import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { mlApi } from '@/lib/apiClient';
import { useLanguage } from '@/lib/languageContext';
import {
  RECOMMENDATIONS,
  getClassificationMetrics,
  getDisplayName,
} from '@/lib/pestData';
import { t } from '@/lib/translations';

export default function AIScanner({ onDetection }) {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const { lang } = useLanguage();

  const [mode, setMode] = useState('idle');
  const [result, setResult] = useState(null);

  const severityColor = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-600',
  };

  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => resolve(null)
      );
    });

  const processImage = async (file) => {
    try {
      setMode('scanning');

      const location = await getLocation();
      const response = await mlApi.predict(file, location?.lat, location?.lng);
      const { pest, confidence } = response.data.data;
      const severity = response.data.severity;

      const detection = {
        pestName: pest,
        confidence,
        severity,
        recommendations: RECOMMENDATIONS[pest] || RECOMMENDATIONS.Unknown,
        metrics: getClassificationMetrics(pest),
      };

      setResult(detection);
      setMode('result');

      if (onDetection) {
        onDetection(detection);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || t(lang, 'scanFailed'));
      setMode('idle');
    }
  };

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      toast.error(t(lang, 'cameraNotReady'));
      return;
    }

    const blob = await fetch(imageSrc).then((response) => response.blob());
    const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
    processImage(file);
  }, [lang]);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t(lang, 'maxFileSize'));
      return;
    }

    processImage(file);
  };

  const reset = () => {
    setMode('idle');
    setResult(null);
  };

  const formatMetric = (value) => `${(value * 100).toFixed(0)}%`;

  return (
    <div className="space-y-6">
      {mode === 'idle' && (
        <div className="relative space-y-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="rounded-xl w-full"
            onUserMediaError={() => toast.error(t(lang, 'cameraAccessDenied'))}
          />

          <button onClick={capture} className="btn-primary w-full">
            <Camera className="w-4 h-4 mr-2" />
            {t(lang, 'scanACrop')}
          </button>

          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost w-full">
            <Upload className="w-4 h-4 mr-2" />
            {t(lang, 'addImage')}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
          />
        </div>
      )}

      {mode === 'scanning' && (
        <div className="text-center py-10">
          <p className="animate-pulse text-lg">{t(lang, 'analyzingCropHealth')}</p>
        </div>
      )}

      {mode === 'result' && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card p-6 space-y-5">
            <h3 className="theme-heading text-xl font-bold">{getDisplayName(result.pestName)}</h3>

            <p className="theme-text">
              {t(lang, 'confidence')}:{' '}
              <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
            </p>

            <p className={severityColor[result.severity]}>
              {t(lang, 'severity')}: {result.severity.toUpperCase()}
            </p>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div>
                <h4 className="font-semibold mb-2">{t(lang, 'recommendedActions')}:</h4>

                {Object.entries(result.recommendations).map(([type, items]) => {
                  if (!Array.isArray(items)) {
                    return (
                      <div key={type} className="mb-3">
                        <h5 className="font-medium capitalize text-accent">
                          {type === 'overview' && t(lang, 'overview')}
                          {type === 'recovery' && t(lang, 'recovery')}
                        </h5>

                        {Object.entries(items).map(([key, value]) => (
                          <div key={key} className="theme-subtext text-sm">
                            - <strong>{key}:</strong> {value}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div key={type} className="mb-3">
                      <h5 className="font-medium capitalize text-accent">
                        {type === 'immediate' && t(lang, 'immediateAction')}
                        {type === 'organic' && t(lang, 'organic')}
                        {type === 'chemical' && t(lang, 'chemical')}
                        {type === 'prevention' && t(lang, 'prevention')}
                        {type === 'symptoms' && t(lang, 'symptoms')}
                      </h5>

                      {items.map((item, index) => (
                        <div key={index} className="theme-subtext text-sm">
                          - {item.action}
                          {item.product && ` (${item.product})`}
                          {item.dosage && ` - ${item.dosage}`}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {result.metrics && (
                <div
                  className="rounded-2xl border p-4 space-y-3 h-fit"
                  style={{ borderColor: 'var(--surface-border)' }}
                >
                  <h4 className="font-semibold">{t(lang, 'modelMetrics')}</h4>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="theme-subtext">
                      <span className="block text-xs uppercase tracking-wide opacity-70">
                        {t(lang, 'precision')}
                      </span>
                      <span className="theme-heading text-base font-semibold">
                        {formatMetric(result.metrics.precision)}
                      </span>
                    </div>

                    <div className="theme-subtext">
                      <span className="block text-xs uppercase tracking-wide opacity-70">
                        {t(lang, 'recall')}
                      </span>
                      <span className="theme-heading text-base font-semibold">
                        {formatMetric(result.metrics.recall)}
                      </span>
                    </div>

                    <div className="theme-subtext">
                      <span className="block text-xs uppercase tracking-wide opacity-70">
                        {t(lang, 'f1Score')}
                      </span>
                      <span className="theme-heading text-base font-semibold">
                        {formatMetric(result.metrics.f1Score)}
                      </span>
                    </div>

                    <div className="theme-subtext">
                      <span className="block text-xs uppercase tracking-wide opacity-70">
                        {t(lang, 'support')}
                      </span>
                      <span className="theme-heading text-base font-semibold">
                        {result.metrics.support}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => onDetection && onDetection({ ...result, triggerAlert: true })}
              className="btn-accent w-full"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t(lang, 'alertNearbyFarmers')}
            </button>

            <button onClick={reset} className="btn-ghost w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              {t(lang, 'scanAgain')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
