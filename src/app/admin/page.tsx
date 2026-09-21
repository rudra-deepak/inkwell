import { requireUser } from "@/lib/auth";
import { AdminVerificationPanel } from "@/components/admin-verification-panel";
export const dynamic="force-dynamic";
export default async function AdminPage(){const user=await requireUser();if(user.email.toLowerCase()!==(process.env.ADMIN_EMAIL||"Rudra763.org.in@gmail.com").toLowerCase())return <div className="pt-10 text-rose-300">Access denied.</div>;return <div className="space-y-6 pt-8"><h1 className="font-serif text-3xl text-white">Verification requests ✦</h1><p className="text-slate-400">Review applications and manage badges.</p><AdminVerificationPanel/></div>}
