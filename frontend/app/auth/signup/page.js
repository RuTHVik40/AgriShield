'use client';

import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, ArrowLeft, Loader, Phone } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/languageContext';
import { t } from '@/lib/translations';

export default function SignUpPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast.error(t(lang, 'allFieldsRequired'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error();
      }

      toast.success(t(lang, 'accountCreated'));
      router.push('/auth/signin');
    } catch {
      toast.error(t(lang, 'signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
        <Link href="/auth/signin" className="text-sm text-primary-500 mb-6 inline-block">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          {t(lang, 'backToSignIn')}
        </Link>

        <div className="glass-card p-8">
          <div className="text-center mb-6">
            <Leaf className="mx-auto mb-3 w-6 h-6 text-primary-500" />
            <h1 className="text-xl font-bold">{t(lang, 'createAccount')}</h1>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder={t(lang, 'fullName')}
              className="input-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />

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

            <button onClick={handleSignup} className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader className="animate-spin w-4 h-4" /> : t(lang, 'signUp')}
            </button>
          </div>

          <div className="my-4 text-center text-sm">{t(lang, 'or')}</div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="btn-ghost w-full mb-2 flex items-center justify-center gap-2"
          >
            <FcGoogle className="w-5 h-5" />
            {t(lang, 'signUpWithGoogle')}
          </button>

          <button className="btn-ghost w-full">
            <Phone className="w-4 h-4 mr-2" />
            {t(lang, 'signUpWithPhone')}
          </button>

          <p className="text-center mt-4 text-sm">
            {t(lang, 'alreadyHaveAccount')}{' '}
            <Link href="/auth/signin" className="text-primary-500 font-medium">
              {t(lang, 'signIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
