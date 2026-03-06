'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

// import * as tf from '@tensorflow/tfjs';

import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Zap, AlertTriangle, CheckCircle, RotateCcw, Wifi, WifiOff } from 'lucide-react';

import toast from 'react-hot-toast';
import { PEST_CLASSES, RECOMMENDATIONS } from '@/lib/pestData';
// let tf = null;
// let model = null;

// async function loadModel() {
  // if (typeof window === "undefined") return null; // prevent server execution

  // if (model) return model;

  // if (!tf) {
  //   tf = await import("@tensorflow/tfjs");
  // }

  // await tf.ready();
  // await tf.setBackend("webgl");

  // model = await tf.loadGraphModel("/model/model.json");

  // console.log("AgriShield model loaded");

  // return model;
// }
// ── Model singleton ────────────────────────────────────────────────────────────
// let _model = null;

// async function loadModel() {
//   if (_model) return _model;
//   try {
//     await tf.setBackend('webgl');
//     await tf.ready();
//     // Load from /public/model/model.json (cached offline via service worker)
//     _model = await tf.loadGraphModel('/model/model.json');;
//     console.log('[AgriShield] TF.js model loaded');
//     return _model;
//   } catch (err) {
//     console.error('[AgriShield] Model load error:', err);
//     throw err;
//   }
// }

// ── Pre-process image for EfficientNet-B0 (224×224) ───────────────────────────
// function preprocessImage(imageElement) {
//   if (!tf) {
//     throw new Error('TensorFlow.js not loaded');
//   }
//   return tf.tidy(() => {
//     const tensor = tf.browser
//       .fromPixels(imageElement)
//       .resizeBilinear([224, 224])
//       .toFloat();

//     // Normalize to [0, 1] then ImageNet normalize
//     const mean = tf.tensor([0.485, 0.456, 0.406]).mul(255);
//     const std  = tf.tensor([0.229, 0.224, 0.225]).mul(255);

//     return tensor.sub(mean).div(std).expandDims(0);
//   });
// }

// ── Main Scanner Component ─────────────────────────────────────────────────────
export default function AIScanner({ onDetection }) {
  const webcamRef   = useRef(null);
  const canvasRef   = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode]             = useState('idle');      // idle | scanning | result | error
  const [modelReady, setModelReady] = useState(false);
  const [loadingModel, setLoadingModel] = useState(true);
  const [facingMode, setFacingMode] = useState('environment');
  const [result, setResult]         = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [isOnline, setIsOnline]     = useState(true);

  // Load model on mount
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // loadModel()
      // .then(() => { setModelReady(true); setLoadingModel(false); })
      setTimeout(() => {
        setModelReady(true);
        setLoadingModel(false);
      }, 800);
      // .catch(() => { 
      //   setLoadingModel(false);
      //   toast.error('Model failed to load. Check /public/model/ directory.');
      // });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Run inference on an image element
  const runInference = useCallback(async (imgEl) => {
    if (!modelReady) {
      toast.error('Model not loaded yet');
      return;
    }

    setMode('scanning');
    setScanProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setScanProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 150);

    try {
      // const model = await loadModel();
      // const input = preprocessImage(imgEl);
      // const predictions = await model.predict(input);
      // const data = await predictions.data();
      // TEMP DUMMY PREDICTIONS
      const data = Array.from({ length: PEST_CLASSES.length }, () => Math.random());

      // normalize probabilities
      const sum = data.reduce((a, b) => a + b, 0);
      const normalized = data.map(v => v / sum);
      // input.dispose();
      // predictions.dispose();

      clearInterval(progressInterval);
      setScanProgress(100);

      // Get top prediction
      // const maxIdx = Array.from(data).indexOf(Math.max(...data));
      // const confidence = data[maxIdx];
      // const pestName = PEST_CLASSES[maxIdx] || 'Unknown';

      // const detection = {
      //   pestName,
      //   confidence: parseFloat(confidence.toFixed(4)),
      //   severity: confidence > 0.85 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
      //   recommendations: RECOMMENDATIONS[pestName] || RECOMMENDATIONS['Unknown'],
      //   timestamp: new Date().toISOString(),
      //   topPredictions: Array.from(data)
      //     .map((score, i) => ({ name: PEST_CLASSES[i], score }))
      //     .sort((a, b) => b.score - a.score)
      //     .slice(0, 5),
      // };

      const maxIdx = normalized.indexOf(Math.max(...normalized));
      const confidence = normalized[maxIdx];
      const pestName = PEST_CLASSES[maxIdx] || 'Unknown';

      const detection = {
        pestName,
        confidence: parseFloat(confidence.toFixed(4)),
        severity: confidence > 0.85 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
        recommendations: RECOMMENDATIONS[pestName] || RECOMMENDATIONS['Unknown'],
        timestamp: new Date().toISOString(),
        topPredictions: normalized
          .map((score, i) => ({ name: PEST_CLASSES[i], score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5),
      };
      setResult(detection);
      setMode('result');

      if (onDetection) onDetection(detection);

    } catch (err) {
      clearInterval(progressInterval);
      console.error('Inference error:', err);
      setMode('error');
      toast.error('Scan failed. Try again.');
    }
  }, [modelReady, onDetection]);

  // Capture from webcam
  const captureFromWebcam = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) { toast.error('Camera not ready'); return; }

    const img = new Image();
    img.onload = () => runInference(img);
    img.src = imageSrc;
  }, [runInference]);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => runInference(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [runInference]);

  const reset = () => { setMode('idle'); setResult(null); setScanProgress(0); };

  const severityConfig = {
    high:   { color: 'text-red-400',     bg: 'bg-red-900/30',     border: 'border-red-700/40',     label: 'High Risk' },
    medium: { color: 'text-accent-400',  bg: 'bg-amber-900/30',   border: 'border-amber-700/40',   label: 'Moderate' },
    low:    { color: 'text-primary-400', bg: 'bg-primary-900/30', border: 'border-primary-700/40', label: 'Low Risk' },
  };

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                          ${modelReady ? 'badge-green' : 'badge-gray'}`}>
            <Zap className="w-3 h-3" />
            {loadingModel ? 'Loading AI...' : modelReady ? 'Model Ready' : 'Model Error'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                          ${isOnline ? 'badge-green' : 'badge-amber'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline Mode'}
          </div>
        </div>
        
        {(mode === 'result' || mode === 'error') && (
          <button onClick={reset} className="btn-ghost py-2 px-4 text-sm">
            <RotateCcw className="w-4 h-4" />
            Rescan
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── IDLE: Camera View ── */}
        {(mode === 'idle' || mode === 'scanning') && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="relative"
          >
            {/* Webcam */}
            <div className="relative rounded-3xl overflow-hidden bg-dark-950 
                            border border-primary-800/30 shadow-glass aspect-[4/3] md:aspect-video">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                videoConstraints={{ facingMode, width: 1280, height: 720 }}
                className="w-full h-full object-cover"
              />

              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Corner markers */}
                  <div className="scanner-corner scanner-corner-tl" />
                  <div className="scanner-corner scanner-corner-tr" />
                  <div className="scanner-corner scanner-corner-bl" />
                  <div className="scanner-corner scanner-corner-br" />
                  
                  {/* Scan line */}
                  {mode === 'scanning' && (
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary-400 to-transparent
                                    top-0 animate-scan-line shadow-glow-green" />
                  )}

                  {/* Center reticle */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border border-primary-500/40 rounded-full" />
                    <div className="absolute w-4 h-4 border border-primary-400/60 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Scanning progress overlay */}
              {mode === 'scanning' && (
                <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-sm flex flex-col 
                                items-center justify-center gap-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(4,120,87,0.2)" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r="44" fill="none"
                        stroke="#047857" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${scanProgress * 2.76} 276`}
                        className="transition-all duration-200"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-primary-300 font-mono text-sm">
                    Analyzing... {Math.round(scanProgress)}%
                  </div>
                </div>
              )}

              {/* Camera flip button */}
              <button
                onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-dark-900/80 backdrop-blur-sm
                           border border-primary-800/40 flex items-center justify-center text-primary-400
                           hover:text-primary-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={captureFromWebcam}
                disabled={!modelReady || mode === 'scanning'}
                className="btn-primary flex-1 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
                {mode === 'scanning' ? 'Scanning...' : 'Scan Crop'}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!modelReady || mode === 'scanning'}
                className="btn-ghost py-4 px-6 disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                Upload
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </motion.div>
        )}

        {/* ── RESULT: Detection Result ── */}
        {mode === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Main result card */}
            <div className={`glass-card p-6 border ${severityConfig[result.severity].border}`}>
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
                                ${severityConfig[result.severity].bg}`}>
                  <AlertTriangle className={`w-6 h-6 ${severityConfig[result.severity].color}`} />
                </div>
                <div>
                  <div className={`badge ${severityConfig[result.severity].bg} 
                                   ${severityConfig[result.severity].color} 
                                   border ${severityConfig[result.severity].border} mb-2`}>
                    {severityConfig[result.severity].label}
                  </div>
                  <h3 className="font-display text-2xl font-700 text-white">{result.pestName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-primary-500 text-sm">Confidence</div>
                    <div className="font-mono text-primary-300 text-sm font-600">
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mb-5">
                <div className="h-2 bg-primary-950 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-700 to-primary-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>

              {/* Top 5 predictions */}
              <div className="space-y-2">
                <div className="text-xs text-primary-600 font-mono uppercase tracking-wider mb-3">
                  Top Predictions
                </div>
                {result.topPredictions.map((pred, i) => (
                  <div key={pred.name} className="flex items-center gap-3">
                    <div className="text-xs text-primary-600 font-mono w-4">{i + 1}</div>
                    <div className="flex-1 text-sm text-primary-300 truncate">{pred.name}</div>
                    <div className="text-xs font-mono text-primary-500">
                      {(pred.score * 100).toFixed(1)}%
                    </div>
                    <div className="w-20 h-1.5 bg-primary-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${pred.score * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <RecommendationCard recommendations={result.recommendations} pestName={result.pestName} />

            {/* Alert button */}
            <button
              onClick={() => {
                if (onDetection) onDetection({ ...result, sendAlert: true });
                toast.success('Alert sent to nearby farmers!', { icon: '📡' });
              }}
              className="btn-accent w-full py-4 text-base"
            >
              <AlertTriangle className="w-5 h-5" />
              Alert Farmers within 5km
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Recommendation Card ──────────────────────────────────────────────────────
function RecommendationCard({ recommendations, pestName }) {
  const [tab, setTab] = useState('immediate');

  return (
    <div className="glass-card p-6">
      <h4 className="font-display font-700 text-white mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-primary-400" />
        Treatment Recommendations
      </h4>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-dark-950/60 rounded-xl p-1">
        {['immediate', 'organic', 'chemical', 'prevention'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-600 capitalize transition-all
                       ${tab === t 
                         ? 'bg-primary-700 text-white shadow-glow-green' 
                         : 'text-primary-500 hover:text-primary-300'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {(recommendations[tab] || []).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 p-3 rounded-xl bg-primary-900/20 border border-primary-800/20"
          >
            <div className="w-5 h-5 rounded-full bg-primary-700 flex items-center justify-center 
                            flex-shrink-0 mt-0.5 text-white text-xs font-mono">
              {i + 1}
            </div>
            <div>
              <div className="text-primary-100 text-sm">{item.action}</div>
              {item.product && (
                <div className="text-accent-400 text-xs mt-1 font-mono">
                  Product: {item.product}
                </div>
              )}
              {item.dosage && (
                <div className="text-primary-500 text-xs">Dosage: {item.dosage}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
