import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

/**
 * God Watch authentication configuration.
 *
 * - Google OAuth only.
 * - JWT session strategy (edge-friendly, fast, no DB session lookups).
 * - PrismaAdapter wires OAuth accounts/users to our PostgreSQL database.
 * - The `id` on the session user is the real DB user id (CUID), which every
 *   server action and query uses for authorization + isolation.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login?error=OAuthError",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // First-time sign-in: user object is present. The PrismaAdapter
      // returns the DB user (with CUID id). Persist it on the token.
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Expose the DB id on the session user for all downstream code.
        (session.user as { id?: string }).id = (token.id as string) ?? "";
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await logActivity({
          userId: user.id,
          type: "LOGIN",
          metadata: { provider: "google" },
        });
      }
    },
  },
  // Trust hosts for Vercel preview deployments.
  trustHost: true,
});

