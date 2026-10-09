import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to God Watch with your Google account.",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <LoginForm />
    </main>
  );
}
