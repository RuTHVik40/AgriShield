'use client';

import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone, Leaf, ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/apiClient';
import { useLanguage } from '@/lib/languageContext';
import { t } from '@/lib/translations';

export default function SignInPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { lang } = useLanguage();

  const [step, setStep] = useState('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [router, session]);

  if (status === 'loading') {
    return null;
  }

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast.error(t(lang, 'enterEmailPassword'));
      return;
    }

    setLoading(true);
    const response = await signIn('email-password', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (response?.ok) {
      toast.success(t(lang, 'loginSuccessful'));
      router.push('/dashboard');
    } else {
      toast.error(t(lang, 'invalidCredentials'));
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const sendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error(t(lang, 'enterValidPhone'));
      return;
    }

    setLoading(true);
    await authApi.sendOtp(`${countryCode}${phone}`);
    setLoading(false);
    setStep('otp');
    toast.success(t(lang, 'otpSent'));
  };

  const verifyOtp = async () => {
    setLoading(true);
    const response = await signIn('phone-otp', {
      phone: `${countryCode}${phone}`,
      otp,
      redirect: false,
    });
    setLoading(false);

    if (response?.ok) {
      toast.success(t(lang, 'loginSuccessful'));
      router.push('/dashboard');
    } else {
      toast.error(t(lang, 'invalidOtp'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div className="w-full max-w-md">
        <Link href="/" className="text-sm text-primary-500 mb-6 inline-block">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          {t(lang, 'back')}
        </Link>

        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <Leaf className="mx-auto mb-3" />
            <h1 className="text-xl font-bold">{t(lang, 'signIn')}</h1>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              placeholder={t(lang, 'email')}
              className="input-field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              placeholder={t(lang, 'password')}
              className="input-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button onClick={handleEmailLogin} className="btn-primary w-full">
              {loading ? <Loader className="animate-spin w-4 h-4" /> : t(lang, 'signIn')}
            </button>
          </div>

          <div className="my-4 text-center text-sm">{t(lang, 'or')}</div>

          <button
            onClick={handleGoogleSignIn}
            className="btn-ghost w-full mb-2 flex items-center justify-center gap-2"
          >
            <FcGoogle className="w-5 h-5" />
            {t(lang, 'continueWithGoogle')}
          </button>

          {step === 'choice' && (
            <button onClick={() => setStep('phone')} className="btn-ghost w-full">
              <Phone className="w-4 h-4 mr-2" />
              {t(lang, 'continueWithPhone')}
            </button>
          )}

          {step === 'phone' && (
            <div className="space-y-3 mt-3">
              <input
                type="tel"
                placeholder={t(lang, 'phone')}
                className="input-field"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <button onClick={sendOtp} className="btn-primary w-full">
                {t(lang, 'sendOtp')}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-3 mt-3">
              <input
                type="text"
                placeholder={t(lang, 'enterOtp')}
                className="input-field"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
              <button onClick={verifyOtp} className="btn-primary w-full">
                {t(lang, 'verifyOtp')}
              </button>
            </div>
          )}

          <p className="text-center mt-4 text-sm">
            {t(lang, 'dontHaveAccount')}{' '}
            <Link href="/auth/signup" className="text-primary-500">
              {t(lang, 'signUp')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
