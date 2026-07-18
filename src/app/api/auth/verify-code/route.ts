import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

function decodeToken(token: string): { email: string; code: string; expires: string } | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, code, type, verificationToken } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'البريد والرمز مطلوبان' }, { status: 400 });
    }

    if (type === 'register') {
      if (!verificationToken) {
        return NextResponse.json({ error: 'رمز جلسة التحقق مفقود' }, { status: 400 });
      }
      const decoded = decodeToken(verificationToken);
      if (!decoded || decoded.email !== email) {
        return NextResponse.json({ error: 'رمز جلسة التحقق غير صالح' }, { status: 400 });
      }
      if (new Date(decoded.expires).getTime() < Date.now()) {
        return NextResponse.json({ error: 'انتهت صلاحية رمز التحقق' }, { status: 400 });
      }
      if (decoded.code !== code) {
        return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 });
      }
      return NextResponse.json({ success: true, verified: true });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return NextResponse.json({ error: 'هذا البريد غير مسجل' }, { status: 404 });
    }

    if (!user.verificationCode || !user.verificationExpires) {
      return NextResponse.json({ error: 'لم يتم إرسال رمز لهذا البريد' }, { status: 400 });
    }

    if (new Date(user.verificationExpires).getTime() < Date.now()) {
      return NextResponse.json({ error: 'انتهت صلاحية رمز التحقق' }, { status: 400 });
    }

    if (user.verificationCode !== code) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 });
    }

    await db.update(users)
      .set({ verificationCode: null, verificationExpires: null, isVerified: true })
      .where(eq(users.email, email));

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التحقق' }, { status: 500 });
  }
}
