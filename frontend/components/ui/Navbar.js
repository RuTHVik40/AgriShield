'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Leaf, Menu, X, Scan, Users, Map, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/dashboard',  label: 'Dashboard', icon: Map },
  { href: '/scanner',    label: 'Scanner',   icon: Scan },
  { href: '/community',  label: 'Community', icon: Users },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      {/* Glass bar */}
      <div className="mx-4 mt-4 rounded-2xl border border-primary-800/30 
                      bg-dark-900/70 backdrop-blur-xl shadow-glass">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-primary-700 flex items-center justify-center
                            shadow-glow-green group-hover:shadow-glow-green transition-shadow">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-700 text-lg text-white">AgriShield</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-primary-400
                           hover:text-primary-100 hover:bg-primary-700/20 transition-all duration-200"
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {/* Notification bell */}
                <button className="relative w-9 h-9 rounded-xl bg-primary-900/50 border border-primary-800/40
                                   flex items-center justify-center text-primary-400 hover:text-primary-100
                                   hover:bg-primary-700/30 transition-all">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 
                                   border border-dark-900 animate-pulse" />
                </button>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl
                               bg-primary-900/50 border border-primary-800/40 
                               text-primary-300 hover:text-primary-100 transition-all text-sm"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary-700 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="hidden sm:block">{session.user?.name?.split(' ')[0] || 'Farmer'}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute right-0 top-full mt-2 w-44 glass-card p-2 shadow-card"
                      >
                        <div className="px-3 py-2 border-b border-primary-800/30 mb-1">
                          <div className="text-xs text-primary-500 truncate">{session.user?.email}</div>
                        </div>
                        <button
                          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                                     text-red-400 hover:bg-red-900/20 transition-colors text-left"
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
              <Link href="/auth/signin" className="btn-primary py-2 px-5 text-sm">
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-xl bg-primary-900/50 border border-primary-800/40
                         flex items-center justify-center text-primary-400"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mx-4 mt-2 rounded-2xl border border-primary-800/30
                       bg-dark-900/90 backdrop-blur-xl p-3 shadow-glass"
          >
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-400
                           hover:text-white hover:bg-primary-700/20 transition-all"
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
