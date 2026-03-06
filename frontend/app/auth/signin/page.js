'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, ChromeIcon, Leaf, ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/apiClient';

export default function SignInPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState('choice');   // choice | phone | otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  if (session) {
    router.push('/dashboard');
    return null;
  }

  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const sendOtp = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter a valid phone number'); return; }
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setOtpSent(true);
      setStep('otp');
      toast.success('OTP sent! Check your phone.');
    } catch {
      toast.error('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const result = await signIn('phone-otp', {
        phone, otp,
        redirect: false,
        callbackUrl: '/dashboard',
      });
      if (result?.ok) {
        toast.success('Welcome to AgriShield!');
        router.push('/dashboard');
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-950 via-dark-950 to-dark-900 pointer-events-none" />
      <div className="fixed inset-0 bg-leaf-pattern opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-primary-500 text-sm mb-8 hover:text-primary-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="glass-card p-8 shadow-glass">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-3xl bg-primary-700 mx-auto flex items-center justify-center 
                            shadow-glow-green mb-4">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-800 text-white mb-1">
              Welcome to AgriShield
            </h1>
            <p className="text-primary-500 text-sm">Sign in to access AI scanning and community alerts</p>
          </div>

          {/* Step: Choice */}
          {step === 'choice' && (
            <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl
                           bg-white text-gray-800 font-600 text-sm
                           hover:bg-gray-100 transition-all duration-200 shadow-md disabled:opacity-60"
              >
                <ChromeIcon className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-primary-900/60" />
                <span className="text-primary-600 text-xs">or</span>
                <div className="flex-1 h-px bg-primary-900/60" />
              </div>

              <button
                onClick={() => setStep('phone')}
                className="btn-ghost w-full py-3.5 text-sm"
              >
                <Phone className="w-5 h-5" />
                Continue with Phone / OTP
              </button>

              <p className="text-center text-xs text-primary-700 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          )}

          {/* Step: Phone */}
          {step === 'phone' && (
            <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="block text-sm text-primary-400 mb-2">Phone Number</label>
                <div className="flex gap-3">
                  <select className="input-field w-20 flex-shrink-0 pr-2">
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+234">🇳🇬 +234</option>
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="input-field flex-1"
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  />
                </div>
              </div>
              <button onClick={sendOtp} disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <button onClick={() => setStep('choice')} className="btn-ghost w-full py-2.5 text-sm">
                Back
              </button>
            </motion.div>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="text-center mb-2">
                <div className="badge-green mx-auto inline-flex mb-3">OTP Sent to {phone}</div>
                <p className="text-primary-400 text-sm">Enter the 6-digit code sent to your phone</p>
              </div>

              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="input-field text-center text-2xl font-mono tracking-widest py-4"
                onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              />

              <button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5 disabled:opacity-50">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button onClick={sendOtp} disabled={loading} className="btn-ghost w-full py-2.5 text-sm">
                Resend OTP
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
