'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Leaf, Menu, X, Scan, Users, Map,
  Bell, LogOut, User, ChevronDown, Sun, Moon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { alertsApi } from '@/lib/apiClient';
import { useLanguage } from '@/lib/languageContext';
import { useTheme } from '@/lib/themeContext';
import { languageOptions, t } from '@/lib/translations';

const DEFAULT_LOCATION = { lat: 17.385, lng: 78.4867 };

export default function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang } = useLanguage();
  const { theme, mounted, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const navLinks = [
    { href: '/dashboard', label: t(lang, 'dashboard'), icon: Map },
    { href: '/scanner', label: t(lang, 'scanner'), icon: Scan },
    { href: '/community', label: t(lang, 'community'), icon: Users },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!session || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocation(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [session]);

  useEffect(() => {
    if (!session || !location) {
      return;
    }

    const fetchAlerts = async () => {
      try {
        const response = await alertsApi.getNearby(location.lat, location.lng);
        const payload = response.data;
        const alerts = Array.isArray(payload)
          ? payload
          : payload?.data ?? payload?.notifications ?? [];

        setNotifications(
          alerts
            .filter(Boolean)
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        );
      } catch (error) {
        console.warn('Alerts fetch warning:', error);
        setNotifications([]);
      }
    };

    fetchAlerts();

    const intervalId = window.setInterval(fetchAlerts, 30000);
    window.addEventListener('focus', fetchAlerts);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', fetchAlerts);
    };
  }, [session, location]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  const formatDistance = (distanceM) => {
    if (typeof distanceM !== 'number') {
      return null;
    }

    if (distanceM >= 1000) {
      return `${(distanceM / 1000).toFixed(1)} km`;
    }

    return `${Math.round(distanceM)} m`;
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="theme-floating mx-4 mt-4 rounded-2xl backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="theme-heading font-semibold">AgriShield</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="theme-nav-link flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`theme-icon-button ${mounted ? 'opacity-100' : 'opacity-0'} w-9 h-9 rounded-xl flex items-center justify-center`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {session ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((current) => !current)}
                    className={`theme-icon-button ${notifOpen ? 'theme-icon-button-active' : ''} relative w-9 h-9 rounded-xl flex items-center justify-center`}
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 bg-red-500 text-white rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="theme-panel absolute right-0 mt-2 w-80 rounded-xl z-50 overflow-hidden"
                      >
                        <div className="theme-subtext px-4 py-2 border-b text-sm font-medium" style={{ borderColor: 'var(--surface-border)' }}>
                          {t(lang, 'notifications')}
                        </div>

                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <p className="theme-muted text-sm px-4 py-3">
                              {t(lang, 'noAlerts')}
                            </p>
                          ) : (
                            notifications.map((notification, index) => (
                              <div
                                key={notification.id ?? `${notification.latitude}-${notification.longitude}-${index}`}
                                className="px-4 py-3 border-b transition"
                                style={{ borderColor: 'var(--surface-border)' }}
                              >
                                <p className="theme-text text-sm font-medium">
                                  {notification.pest_name} {t(lang, 'detected')}
                                </p>
                                {formatDistance(notification.distance_m) && (
                                  <p className="theme-muted text-xs">
                                    {formatDistance(notification.distance_m)} {t(lang, 'away')}
                                  </p>
                                )}
                                <p className={`text-xs mt-1 font-semibold ${getSeverityColor(notification.severity)}`}>
                                  {(notification.severity || 'low').toUpperCase()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((current) => !current)}
                    className={`theme-icon-button ${profileOpen ? 'theme-icon-button-active' : ''} flex items-center gap-2 px-3 py-1.5 rounded-xl`}
                  >
                    <div className="w-6 h-6 bg-primary-700 rounded-lg flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="hidden sm:block">
                      {session.user?.name?.split(' ')[0] || t(lang, 'farmer')}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="theme-panel absolute right-0 mt-2 w-52 p-2 rounded-xl z-50"
                      >
                        <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--surface-border)' }}>
                          <p className="theme-muted text-xs truncate">
                            {session.user?.email}
                          </p>
                        </div>

                        <div className="px-3 py-2">
                          <p className="theme-muted text-xs mb-1">
                            {t(lang, 'language')}
                          </p>
                          <select
                            value={lang}
                            className="input-field w-full px-2 py-1 text-sm"
                            onChange={(event) => setLang(event.target.value)}
                          >
                            {languageOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          {t(lang, 'signOut')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link href="/auth/signin" className="btn-primary px-5 py-2 text-sm">
                {t(lang, 'signIn')}
              </Link>
            )}

            <button
              onClick={() => setMobileOpen((current) => !current)}
              className="theme-icon-button md:hidden w-9 h-9 rounded-xl"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="theme-panel md:hidden mx-4 mt-2 rounded-2xl p-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="theme-nav-link flex items-center gap-3 px-4 py-3 rounded-xl"
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
