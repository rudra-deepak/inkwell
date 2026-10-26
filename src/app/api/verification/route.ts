import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createVerificationRequest } from "@/lib/store";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 20 || reason.length > 1000) return NextResponse.json({ error: "Reason must be 20–1000 characters." }, { status: 400 });
  try {
    const item = await createVerificationRequest(user.id, reason);
    const admin = process.env.ADMIN_EMAIL || "Rudra763.org.in@gmail.com";
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [admin], reply_to: user.email, subject: `Inkwell verification request from ${user.email}`, text: `User: ${user.name}  <DeveloperBadge email={user.email} />\nEmail: ${user.email}\nReason:\n${reason}\n\nReview it at your admin dashboard.` }) });
    }
    return NextResponse.json({ request: item }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Could not submit request." }, { status: 400 }); }
}
