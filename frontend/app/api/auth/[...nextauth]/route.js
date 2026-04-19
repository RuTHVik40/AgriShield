import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions = {
  providers: [
    // 🔹 Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // 🔹 Phone OTP
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: credentials.phone,
              otp: credentials.otp,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.detail || 'Invalid OTP');
          }

          return {
            id: data.user.id,
            name: data.user.name,
            phone: data.user.phone,
            accessToken: data.access_token,
          };
        } catch (err) {
          throw new Error(err.message || 'Authentication failed');
        }
      },
    }),

    // 🔥 NEW: Email + Password (Simple JWT)
    CredentialsProvider({
      id: 'email-password',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.detail || 'Invalid credentials');
          }

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            accessToken: data.access_token,
          };
        } catch (err) {
          throw new Error(err.message || 'Login failed');
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // 🔥 GOOGLE LOGIN → BACKEND
      if (account?.provider === 'google' && account?.id_token) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              google_id_token: account.id_token,
              email: token.email,
              name: token.name,
            }),
          });

          const data = await res.json();

          if (data?.access_token) {
            token.accessToken = data.access_token;
            token.id = data.user.id;
          }
        } catch (e) {
          console.error('Google backend auth failed:', e);
        }
      }

      // 🔹 OTP + Email login
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
        token.email = user.email;
        token.accessToken = user.accessToken || token.accessToken;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        phone: token.phone,
        email: token.email,
      };
      session.accessToken = token.accessToken;
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };