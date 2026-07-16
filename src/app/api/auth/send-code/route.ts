import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    if (type === 'login') {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) {
        return NextResponse.json({ error: 'هذا البريد غير مسجل' }, { status: 404 });
      }
    }

    if (type === 'register') {
      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) {
        return NextResponse.json({ error: 'هذا البريد مسجل بالفعل' }, { status: 400 });
      }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Send email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;

    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Zivv <onboarding@resend.dev>',
            to: email,
            subject: `${code} :رمز التحقق من Zivv`,
            html: `
              <div dir="rtl" style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:30px;background:#000;color:#fff;border-radius:16px">
                <div style="text-align:center;margin-bottom:24px">
                  <h1 style="font-size:32px;margin:0">Zivv</h1>
                  <p style="color:#737373;font-size:14px;margin:8px 0 0">رمز التحقق الخاص بك</p>
                </div>
                <div style="text-align:center;font-size:40px;font-weight:bold;letter-spacing:10px;padding:24px;background:#111;border-radius:12px;margin:20px 0;color:#0095f6">
                  ${code}
                </div>
                <p style="text-align:center;color:#737373;font-size:12px;margin:16px 0 0">
                  هذا الرمز صالح لمدة 10 دقائق فقط.<br>
                  إذا لم تطلب هذا الرمز، تجاهل هذا البريد.
                </p>
              </div>
            `,
          }),
        });

        if (res.ok) {
          emailSent = true;
        } else {
          const errData = await res.json();
          console.error('Resend error:', errData);
        }
      } catch (e) {
        console.error('Resend failed:', e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      emailSent,
      // Only show code if email wasn't sent (fallback for demo)
      ...(emailSent ? {} : { code }),
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
