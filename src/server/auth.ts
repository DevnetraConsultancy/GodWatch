import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/server/auth-config";
import { prisma } from "@/server/db";
import { logActivity } from "@/server/activity";

/** Full Auth.js instance (Node runtime): Google OAuth persisted through Prisma. */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    signIn({ account, profile }) {
      // Only accept Google accounts with a verified email address.
      return account?.provider === "google" && profile?.email_verified === true;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await logActivity(user.id, "LOGIN", { provider: "google" });
    },
  },
});
