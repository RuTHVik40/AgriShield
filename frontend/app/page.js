'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Shield, Scan, Users, Map, Bell, ArrowRight, Leaf } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import { useLanguage } from '@/lib/languageContext';
import { t } from '@/lib/translations';

export default function HomePage() {
  const { data: session } = useSession();
  const { lang } = useLanguage();

  const stats = [
    { label: t(lang, 'pestsDetected'), value: '47,239', icon: Scan, color: 'text-primary-400' },
    { label: t(lang, 'farmersProtected'), value: '12,841', icon: Users, color: 'text-accent-400' },
    { label: t(lang, 'alertsSent'), value: '8,302', icon: Bell, color: 'text-red-400' },
    { label: t(lang, 'regionsCovered'), value: '218', icon: Map, color: 'text-blue-400' },
  ];

  const features = [
    {
      icon: Scan,
      title: t(lang, 'aiPestScanner'),
      desc: t(lang, 'aiPestScannerDesc'),
      color: 'from-primary-700/20 to-primary-900/10',
      border: 'border-primary-700/30',
      href: '/scanner',
      cta: t(lang, 'scanACrop'),
    },
    {
      icon: Bell,
      title: t(lang, 'digitalFirewall'),
      desc: t(lang, 'digitalFirewallDesc'),
      color: 'from-red-900/20 to-red-950/10',
      border: 'border-red-700/30',
      href: '/dashboard',
      cta: t(lang, 'viewAlerts'),
    },
    {
      icon: Map,
      title: t(lang, 'infestationHeatmap'),
      desc: t(lang, 'infestationHeatmapDesc'),
      color: 'from-blue-900/20 to-blue-950/10',
      border: 'border-blue-700/30',
      href: '/community',
      cta: t(lang, 'seeHeatmap'),
    },
    {
      icon: Users,
      title: t(lang, 'farmerCommunity'),
      desc: t(lang, 'farmerCommunityDesc'),
      color: 'from-accent-900/20 to-amber-950/10',
      border: 'border-accent-700/30',
      href: '/community',
      cta: t(lang, 'joinCommunity'),
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative pt-28 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary-700/10 blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="theme-floating theme-subtext inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm"
          >
            <Shield className="w-4 h-4" />
            {t(lang, 'homeBadge')}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-800 leading-tight mb-6"
          >
            {t(lang, 'homeHeroTitleLine1')}
            <br />
            <span className="text-gradient-green">{t(lang, 'homeHeroTitleLine2')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="theme-subtext text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t(lang, 'homeHeroDesc')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href={session ? '/scanner' : '/auth/signin'} className="btn-primary text-base px-8 py-4">
              <Scan className="w-5 h-5" />
              {t(lang, 'startScanning')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/community" className="btn-ghost text-base px-8 py-4">
              <Users className="w-5 h-5" />
              {t(lang, 'viewCommunity')}
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.4 }}
              className="stat-card text-center"
            >
              <stat.icon className={`w-6 h-6 mx-auto ${stat.color} mb-2`} />
              <div className="theme-heading font-display text-2xl md:text-3xl font-800">{stat.value}</div>
              <div className="theme-muted text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-8 max-w-7xl mx-auto mb-24">
        <div className="text-center mb-12">
          <h2 className="section-heading mb-3">{t(lang, 'everythingYourFarmNeeds')}</h2>
          <p className="theme-muted max-w-xl mx-auto">{t(lang, 'homeSectionDesc')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.5 }}
              className={`glass-card p-8 bg-gradient-to-br ${feature.color} border ${feature.border} group hover:scale-[1.01] transition-transform`}
            >
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary-300" />
                </div>
                <div className="flex-1">
                  <h3 className="theme-heading font-display text-xl font-700 mb-2">{feature.title}</h3>
                  <p className="theme-subtext text-sm leading-relaxed mb-5">{feature.desc}</p>
                  <Link href={feature.href} className="btn-ghost text-sm px-4 py-2 inline-flex">
                    {feature.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="theme-footer py-8 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="w-4 h-4 text-primary-600" />
          <span className="theme-subtext font-display font-600">AgriShield</span>
        </div>
        <p>{t(lang, 'builtForFuture')} © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
