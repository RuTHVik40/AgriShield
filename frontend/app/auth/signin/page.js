'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, Leaf, ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/apiClient';

export default function SignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState('choice');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  if (status === 'loading') {
    return null; // or a loading spinner
  }
  if (session) {
    router.push('/dashboard');
    return null;
  }

  // 🔹 Google Login
  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  // 🔹 Send OTP
  const sendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp(`${countryCode}${phone}`);
      setStep('otp');
      toast.success('OTP sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Verify OTP
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('phone-otp', {
        phone: `${countryCode}${phone}`,
        otp,
        redirect: false,
      });

      if (result?.ok) {
        toast.success('Login successful');
        router.push('/dashboard');
      } else {
        toast.error('Invalid OTP');
      }
    } catch (err) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">

        <Link href="/" className="text-sm text-primary-500 mb-6 inline-block">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          Back
        </Link>

        <div className="glass-card p-8">

          <div className="text-center mb-6">
            <Leaf className="mx-auto mb-3" />
            <h1 className="text-xl font-bold">AgriShield</h1>
          </div>

          {/* STEP 1 */}
          {step === 'choice' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                className="btn-primary w-full"
                disabled={loading}
              >
                Continue with Google
              </button>

              <button
                onClick={() => setStep('phone')}
                className="btn-ghost w-full"
              >
                <Phone className="w-4 h-4 mr-2" />
                Continue with Phone
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="input-field w-24"
                >
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                </select>

                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field flex-1"
                />
              </div>

              <button onClick={sendOtp} className="btn-primary w-full" disabled={loading}>
                {loading ? <Loader className="animate-spin w-4 h-4" /> : 'Send OTP'}
              </button>
            </div>
          )}

          {/* STEP 3 */}
          {step === 'otp' && (
            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="input-field text-center"
                placeholder="Enter OTP"
              />

              <button onClick={verifyOtp} className="btn-primary w-full" disabled={loading}>
                {loading ? <Loader className="animate-spin w-4 h-4" /> : 'Verify OTP'}
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}