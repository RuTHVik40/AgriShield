'use client';
import { FcGoogle } from 'react-icons/fc';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, ArrowLeft, Loader, Phone } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/apiClient';

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('choice');

  const [loading, setLoading] = useState(false);

  // 🔹 EMAIL SIGNUP
  const handleSignup = async () => {
    if (!name || !email || !password) {
      toast.error('All fields required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) throw new Error();

      toast.success('Account created!');
      router.push('/auth/signin');
    } catch {
      toast.error('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">

        {/* 🔥 BACK BUTTON (FIXED) */}
        <Link href="/auth/signin" className="text-sm text-primary-500 mb-6 inline-block">
          <ArrowLeft className="w-4 h-4 inline mr-2" />
          Back to Sign In
        </Link>

        <div className="glass-card p-8">

          {/* 🔥 FIXED ICON + HEADER */}
          <div className="text-center mb-6">
            <Leaf className="mx-auto mb-3 w-6 h-6 text-primary-500" />
            <h1 className="text-xl font-bold">Create Account</h1>
          </div>

          {/* EMAIL SIGNUP */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

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

            <button onClick={handleSignup} className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader className="animate-spin w-4 h-4" /> : 'Sign Up'}
            </button>
          </div>

          <div className="my-4 text-center text-sm">or</div>


<button
  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
  className="btn-ghost w-full mb-2 flex items-center justify-center gap-2"
>
  <FcGoogle className="w-5 h-5" />
  Sign up with Google
</button>

          {/* PHONE */}
          <button onClick={() => setStep('phone')} className="btn-ghost w-full">
            <Phone className="w-4 h-4 mr-2" />
            Sign up with Phone
          </button>

          <p className="text-center mt-4 text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-primary-500 font-medium">
              Sign in
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
}