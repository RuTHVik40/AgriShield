'use client';
import { FcGoogle } from 'react-icons/fc';
import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, Mail, Lock, Leaf, ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/apiClient';
import { useEffect } from 'react';
export default function SignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (session) {
    router.push('/dashboard');
  }
}, [session, router]);

if (status === 'loading') return null;

  // 🔹 EMAIL LOGIN (PRIMARY)
  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email & password');
      return;
    }

    setLoading(true);
    const res = await signIn('email-password', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.ok) {
      toast.success('Login successful');
      router.push('/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  // 🔹 GOOGLE
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  // 🔹 OTP SEND
  const sendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error('Enter valid phone');
      return;
    }

    setLoading(true);
    await authApi.sendOtp(`${countryCode}${phone}`);
    setLoading(false);
    setStep('otp');
    toast.success('OTP sent');
  };

  // 🔹 OTP VERIFY
  const verifyOtp = async () => {
    setLoading(true);
    const res = await signIn('phone-otp', {
      phone: `${countryCode}${phone}`,
      otp,
      redirect: false,
    });
    setLoading(false);

    if (res?.ok) {
      toast.success('Login successful');
      router.push('/dashboard');
    } else {
      toast.error('Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div className="w-full max-w-md">
      <Link href="/" className="text-sm text-primary-500 mb-6 inline-block">
  <ArrowLeft className="w-4 h-4 inline mr-2" />
  Back
</Link>
        <div className="glass-card p-8">

          <div className="text-center mb-6">
            <Leaf className="mx-auto mb-3" />
            <h1 className="text-xl font-bold">Sign In</h1>
          </div>

          {/* 🔥 PRIMARY LOGIN */}
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleEmailLogin} className="btn-primary w-full">
              {loading ? <Loader className="animate-spin w-4 h-4" /> : 'Sign In'}
            </button>
          </div>

          <div className="my-4 text-center text-sm">or</div>

          {/* GOOGLE */}
          <button
  onClick={handleGoogleSignIn}
  className="btn-ghost w-full mb-2 flex items-center justify-center gap-2"
>
  <FcGoogle className="w-5 h-5" />
  Continue with Google
</button>

          {/* PHONE */}
          {step === 'choice' && (
            <button onClick={() => setStep('phone')} className="btn-ghost w-full">
              <Phone className="w-4 h-4 mr-2" />
              Continue with Phone
            </button>
          )}

          {step === 'phone' && (
            <div className="space-y-3 mt-3">
              <input
                type="tel"
                placeholder="Phone"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button onClick={sendOtp} className="btn-primary w-full">
                Send OTP
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-3 mt-3">
              <input
                type="text"
                placeholder="Enter OTP"
                className="input-field"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button onClick={verifyOtp} className="btn-primary w-full">
                Verify OTP
              </button>
            </div>
          )}

          <p className="text-center mt-4 text-sm">
            Don’t have an account?{' '}
            <Link href="/auth/signup" className="text-primary-500">
              Sign up
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
}