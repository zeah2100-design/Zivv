import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, type, username, password, birthDate } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    const [existingUser] = await db.select().from(users).where(eq(users.email, email));

    if (type === 'login') {
      if (!existingUser) {
        return NextResponse.json({ error: 'هذا البريد غير مسجل' }, { status: 404 });
      }
      await db.update(users)
        .set({ verificationCode: code, verificationExpires: expires })
        .where(eq(users.email, email));
    } else {
      if (existingUser) {
        return NextResponse.json({ error: 'هذا البريد مسجل بالفعل' }, { status: 400 });
      }
      // For registration, return a temporary verification token encoded with the email/code.
      // The register endpoint will validate it using the submitted code.
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'خدمة البريد غير متاحة حالياً' }, { status: 500 });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Zivv <onboarding@resend.dev>',
        to: email,
        subject: `${code} رمز التحقق - Zivv`,
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:30px;background:#000;color:#fff;border-radius:16px">
            <h1 style="text-align:center;font-size:34px;margin:0 0 8px">Zivv</h1>
            <p style="text-align:center;color:#a0a0a0;font-size:14px;margin:0 0 20px">رمز التحقق الخاص بك</p>
            <div style="text-align:center;font-size:40px;font-weight:bold;letter-spacing:10px;padding:24px;background:#111;border-radius:12px;color:#0095f6">${code}</div>
            <p style="text-align:center;color:#737373;font-size:12px;margin:16px 0 0">صالح لمدة 10 دقائق. لا تشارك الرمز مع أي شخص.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      console.error('Resend error:', err);
      return NextResponse.json({ error: 'فشل إرسال البريد. تأكد من صحة البريد الإلكتروني.' }, { status: 500 });
    }

    // In registration mode we cannot save the code in a non-existing user row.
    // Return a signed-like temporary token for this sandbox implementation.
    const verificationToken = Buffer.from(JSON.stringify({ email, code, expires: expires.toISOString() })).toString('base64url');

    return NextResponse.json({ success: true, emailSent: true, verificationToken });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال رمز التحقق' }, { status: 500 });
  }
}
