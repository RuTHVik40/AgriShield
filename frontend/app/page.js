'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Scan, Users, Map, Bell, Zap, ArrowRight, Leaf } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';

const stats = [
  { label: 'Pests Detected', value: '47,239', icon: Scan, color: 'text-primary-400' },
  { label: 'Farmers Protected', value: '12,841', icon: Users, color: 'text-accent-400' },
  { label: 'Alerts Sent', value: '8,302', icon: Bell, color: 'text-red-400' },
  { label: 'Regions Covered', value: '218', icon: Map, color: 'text-blue-400' },
];

const features = [
  {
    icon: Scan,
    title: 'AI Pest Scanner',
    desc: 'EfficientNet + MobileNetV2 hybrid model with SE attention. Works offline in your browser.',
    color: 'from-primary-700/20 to-primary-900/10',
    border: 'border-primary-700/30',
    href: '/scanner',
    cta: 'Scan a Crop',
  },
  {
    icon: Bell,
    title: 'Digital Firewall',
    desc: 'Real-time proximity alerts. When a pest is detected nearby, every farmer within 5km is notified.',
    color: 'from-red-900/20 to-red-950/10',
    border: 'border-red-700/30',
    href: '/dashboard',
    cta: 'View Alerts',
  },
  {
    icon: Map,
    title: 'Infestation Heatmap',
    desc: 'Live geospatial heatmap of pest activity in your region. Powered by PostGIS.',
    color: 'from-blue-900/20 to-blue-950/10',
    border: 'border-blue-700/30',
    href: '/community',
    cta: 'See Heatmap',
  },
  {
    icon: Users,
    title: 'Farmer Community',
    desc: 'Share sightings, post photos, discuss treatment. A trusted network of field intelligence.',
    color: 'from-accent-900/20 to-amber-950/10',
    border: 'border-accent-700/30',
    href: '/community',
    cta: 'Join Community',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Glowing orb */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full 
                        bg-primary-700/10 blur-3xl pointer-events-none" />
        
        <div className="relative text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6
                       bg-primary-900/50 border border-primary-700/40 text-primary-300 text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            AI-Powered Precision Agriculture
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-800 leading-tight mb-6"
          >
            Protect Your Crops.
            <br />
            <span className="text-gradient-green">Shield Your Farm.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-primary-300/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Scan crops with AI, detect pests instantly, and receive community alerts 
            when infestations appear within 5km of your farm — even offline.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href={session ? '/scanner' : '/auth/signin'} className="btn-primary text-base px-8 py-4">
              <Scan className="w-5 h-5" />
              Start Scanning
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/community" className="btn-ghost text-base px-8 py-4">
              <Users className="w-5 h-5" />
              View Community
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.4 }}
              className="stat-card text-center"
            >
              <s.icon className={`w-6 h-6 mx-auto ${s.color} mb-2`} />
              <div className="font-display text-2xl md:text-3xl font-800 text-white">{s.value}</div>
              <div className="text-primary-600 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-3">Everything Your Farm Needs</h2>
          <p className="text-primary-500 max-w-xl mx-auto">
            A complete digital intelligence layer for modern agriculture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.5 }}
              className={`glass-card p-8 bg-gradient-to-br ${f.color} border ${f.border} group hover:scale-[1.01] transition-transform`}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 text-primary-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-700 text-white mb-2">{f.title}</h3>
                  <p className="text-primary-400 text-sm leading-relaxed mb-5">{f.desc}</p>
                  <Link href={f.href} className="btn-ghost text-sm px-4 py-2 inline-flex">
                    {f.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary-900/40 py-8 px-4 text-center text-primary-700 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-primary-600" />
          <span className="font-display font-600 text-primary-500">AgriShield</span>
        </div>
        <p>Built for the future of farming. © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
