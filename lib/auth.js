import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcryptjs from 'bcryptjs';
import { getUserByEmail } from './db';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = getUserByEmail(credentials.email);
        if (!user) return null;
        const isValid = bcryptjs.compareSync(credentials.password, user.password_hash);
        if (!isValid) return null;
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          apartment: user.apartment,
          role: user.role,
        };
      },
    }),
  ],
});
