/** Auth config shared between middleware (Edge) and server (Node.js).
 *  This file must NOT import any Node.js-only modules.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes
      if (pathname === '/' || pathname === '/login' || pathname.startsWith('/api/auth')) {
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      // Admin-only routes
      if (pathname.startsWith('/admin') && auth.user?.role !== 'admin') {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.apartment = user.apartment;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.apartment = token.apartment;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [], // Filled in lib/auth.js for server-side only
};
