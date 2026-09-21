import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listVerificationRequests, reviewVerificationRequest } from "@/lib/store";
async function admin() { const user = await getCurrentUser(); return user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || "Rudra763.org.in@gmail.com").toLowerCase() ? user : null; }
export async function GET() { if (!(await admin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); return NextResponse.json({ requests: await listVerificationRequests() }); }
export async function PATCH(request: Request) { if (!(await admin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 }); const body = await request.json(); if (!body.id || !["approved","rejected"].includes(body.status)) return NextResponse.json({ error: "Invalid request" }, { status: 400 }); return NextResponse.json({ request: await reviewVerificationRequest(body.id, body.status) }); }
