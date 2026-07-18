import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Store codes in memory (in production use Redis)
const codes = new Map<string, { code: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();
    if (!email) return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });

    if (type === 'login') {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return NextResponse.json({ error: 'هذا البريد غير مسجل' }, { status: 404 });
    }

    if (type === 'register') {
      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) return NextResponse.json({ error: 'هذا البريد مسجل بالفعل' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    codes.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });

    // Send real email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'خدمة البريد غير متاحة' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'Zivv <onboarding@resend.dev>',
        to: email,
        subject: `${code} رمز التحقق - Zivv`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:30px;background:#000;color:#fff;border-radius:16px">
            <h1 style="text-align:center;font-size:32px;margin:0 0 8px">Zivv</h1>
            <p style="text-align:center;color:#a0a0a0;font-size:14px;margin:0 0 20px">رمز التحقق الخاص بك</p>
            <div style="text-align:center;font-size:40px;font-weight:bold;letter-spacing:10px;padding:24px;background:#111;border-radius:12px;color:#0095f6">${code}</div>
            <p style="text-align:center;color:#737373;font-size:12px;margin:16px 0 0">صالح لمدة 10 دقائق</p>
          </div>`,
      }),
    });

    if (!res.ok) {
      console.error('Resend error:', await res.text());
      return NextResponse.json({ error: 'فشل إرسال البريد. تأكد من صحة البريد الإلكتروني.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// Export codes map for verification
export { codes };
