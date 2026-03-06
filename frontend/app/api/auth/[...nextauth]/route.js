import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const authOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    // Phone/OTP via backend verification
    CredentialsProvider({
      id:   'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        otp:   { label: 'OTP',   type: 'text' },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/otp/verify`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ phone: credentials.phone, otp: credentials.otp }),
          });
          
          if (!res.ok) return null;
          const data = await res.json();
          
          return {
            id:          data.user.id,
            name:        data.user.name || credentials.phone,
            phone:       data.user.phone,
            accessToken: data.access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // On initial sign-in
      if (user) {
        token.id          = user.id;
        token.phone       = user.phone;
        token.accessToken = user.accessToken || account?.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id          = token.id;
      session.user.phone       = token.phone;
      session.accessToken      = token.accessToken;
      return session;
    },
  },

  pages: {
    signIn:  '/auth/signin',
    signOut: '/auth/signout',
    error:   '/auth/error',
  },

  session:    { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret:     process.env.NEXTAUTH_SECRET,
  debug:      process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
