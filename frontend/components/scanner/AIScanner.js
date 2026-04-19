'use client';

import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import { mlApi } from '@/lib/apiClient';
import { RECOMMENDATIONS, getDisplayName } from '@/lib/pestData';

export default function AIScanner({ onDetection }) {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('idle'); // idle | scanning | result
  const [result, setResult] = useState(null);

  // ── Severity Colors ──
  const severityColor = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-orange-500',
    critical: 'text-red-600',
  };

  // ── Get Location ──
  const getLocation = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () => resolve(null)
      );
    });

  // ── Backend ML Call ──
  const processImage = async (file) => {
    try {
      setMode('scanning');

      const location = await getLocation();

      const res = await mlApi.predict(
        file,
        location?.lat,
        location?.lng
      );

      const { pest, confidence } = res.data.data;
      const severity = res.data.severity;

      const detection = {
        pestName: pest,
        confidence,
        severity,
        recommendations:
          RECOMMENDATIONS[pest] || RECOMMENDATIONS['Unknown'],
      };

      setResult(detection);
      setMode('result');

      if (onDetection) onDetection(detection);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Scan failed');
      setMode('idle');
    }
  };

  // ── Camera Capture ──
  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc) {
      toast.error('Camera not ready');
      return;
    }

    const blob = await fetch(imageSrc).then((res) => res.blob());
    const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });

    processImage(file);
  }, []);

  // ── Upload ──
  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size is 5MB');
      return;
    }

    processImage(file);
  };

  // ── Reset ──
  const reset = () => {
    setMode('idle');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* ── Camera / Upload ── */}
      {mode === 'idle' && (
        <div className="relative space-y-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="rounded-xl w-full"
            onUserMediaError={() => toast.error('Camera access denied')}
          />

          <button onClick={capture} className="btn-primary w-full">
            <Camera className="w-4 h-4 mr-2" />
            Scan Crop
          </button>

          <button
            onClick={() => fileInputRef.current.click()}
            className="btn-ghost w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
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

      {/* ── Loading ── */}
      {mode === 'scanning' && (
        <div className="text-center py-10">
          <p className="animate-pulse text-lg">
            🔍 Analyzing crop health...
          </p>
        </div>
      )}

      {/* ── Result ── */}
      {mode === 'result' && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-card p-6 space-y-5">
            {/* Pest Name */}
            <h3 className="text-xl font-bold">
              {getDisplayName(result.pestName)}
            </h3>

            {/* Confidence */}
            <p>
              Confidence:{' '}
              <span className="font-semibold">
                {(result.confidence * 100).toFixed(1)}%
              </span>
            </p>

            {/* Severity */}
            <p className={severityColor[result.severity]}>
              Severity: {result.severity.toUpperCase()}
            </p>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold mb-2">
                Recommended Actions:
              </h4>

              {Object.entries(result.recommendations).map(([type, items]) => {
  // 🔹 HANDLE OBJECT TYPES (overview, recovery)
  if (!Array.isArray(items)) {
    return (
      <div key={type} className="mb-3">
        <h5 className="font-medium capitalize text-accent">
          {type === "overview" && "📊 Overview"}
          {type === "recovery" && "💡 Recovery"}
        </h5>

        {Object.entries(items).map(([key, value]) => (
          <div key={key} className="text-sm text-primary-300">
            • <strong>{key}:</strong> {value}
          </div>
        ))}
      </div>
    );
  }

  // 🔹 HANDLE ARRAY TYPES (normal case)
  return (
    <div key={type} className="mb-3">
      <h5 className="font-medium capitalize text-accent">
        {type === "immediate" && "🚨 Immediate Action"}
        {type === "organic" && "🌿 Organic"}
        {type === "chemical" && "🧪 Chemical"}
        {type === "prevention" && "🛡 Prevention"}
        {type === "symptoms" && "🔍 Symptoms"}
      </h5>

      {items.map((r, i) => (
        <div key={i} className="text-sm text-primary-300">
          • {r.action}
          {r.product && ` (${r.product})`}
          {r.dosage && ` – ${r.dosage}`}
        </div>
      ))}
    </div>
  );
})}
            </div>

            {/* Alert Button */}
            <button
              onClick={() =>
                onDetection &&
                onDetection({ ...result, triggerAlert: true })
              }
              className="btn-accent w-full"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alert Nearby Farmers
            </button>

            {/* Reset */}
            <button onClick={reset} className="btn-ghost w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Scan Again
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}