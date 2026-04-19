'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Leaf, Menu, X, Scan, Users, Map,
  Bell, LogOut, User, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Map },
  { href: '/scanner', label: 'Scanner', icon: Scan },
  { href: '/community', label: 'Community', icon: Users },
];

export default function Navbar() {
  const { data: session } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // 🔥 Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const lat = 17.3960;
        const lng = 78.3128;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/alerts/nearby?lat=${lat}&lng=${lng}`
        );

        console.log("Status:", res.status);

        const data = await res.json();
        console.log("API response:", data);

        const notifications = Array.isArray(data)
          ? data
          : data?.data || data?.notifications || [];

        setNotifications(notifications);

      } catch (err) {
        console.error("Fetch error:", err);
        setNotifications([]);
      }
    };

    fetchAlerts();
  }, []);

  // 🎨 Severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-4 mt-4 rounded-2xl border border-primary-800/30 
                      bg-dark-900/70 backdrop-blur-xl shadow-glass">

        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">AgriShield</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-primary-400
                           hover:text-white hover:bg-primary-700/20"
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {/* 🔔 Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative w-9 h-9 rounded-xl bg-primary-900/50 border border-primary-800/40
                               flex items-center justify-center text-primary-400 hover:text-white"
                  >
                    <Bell className="w-4 h-4" />

                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0.5 
                                       bg-red-500 text-white rounded-full">
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
                        className="absolute right-0 mt-2 w-80 bg-dark-900 border border-primary-800/40 
                                   rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-primary-800/30 text-sm text-primary-300 font-medium">
                          Notifications
                        </div>

                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <p className="text-sm text-primary-400 px-4 py-3">
                              No alerts
                            </p>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                className="px-4 py-3 border-b border-primary-800/20 
                                           hover:bg-primary-700/10 transition"
                              >
                                <p className="text-sm text-white font-medium">
                                  {n.pest_name} detected
                                </p>

                                <p className="text-xs text-primary-400">
                                  {Math.round(n.distance_m)}m away
                                </p>

                                <p className={`text-xs mt-1 font-semibold ${getSeverityColor(n.severity)}`}>
                                  {n.severity.toUpperCase()}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 👤 Profile */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                               bg-primary-900/50 border border-primary-800/40 text-primary-300"
                  >
                    <div className="w-6 h-6 bg-primary-700 rounded-lg flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="hidden sm:block">
                      {session.user?.name?.split(' ')[0] || 'Farmer'}
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
                        className="absolute right-0 mt-2 w-52 p-2 
                                   bg-dark-900 border border-primary-800/40 
                                   rounded-xl shadow-xl z-50"
                      >
                        <div className="px-3 py-2 border-b border-primary-800/30">
                          <p className="text-xs text-primary-500 truncate">
                            {session.user?.email}
                          </p>
                        </div>

                        {/* 🌐 Language Switch */}
                        <div className="px-3 py-2">
                          <p className="text-xs text-primary-400 mb-1">Language</p>
                          <select
                            className="w-full bg-dark-800 text-sm text-white px-2 py-1 rounded-md border border-primary-700"
                            onChange={(e) => {
                              console.log("Selected language:", e.target.value);
                            }}
                          >
                            <option value="en">English</option>
                            <option value="te">Telugu</option>
                            <option value="hi">Hindi</option>
                          </select>
                        </div>

                        <button
                          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 
                                     hover:bg-red-900/20 rounded-lg mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link href="/auth/signin" className="btn-primary px-5 py-2 text-sm">
                Sign In
              </Link>
            )}

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 bg-primary-900/50 border border-primary-800/40 rounded-xl"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mx-4 mt-2 bg-dark-900 rounded-2xl p-3"
          >
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-primary-400 hover:text-white"
              >
                <l.icon className="w-5 h-5" />
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}