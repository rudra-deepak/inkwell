import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="pt-12">
      <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}
