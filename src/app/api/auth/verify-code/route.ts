import { NextRequest, NextResponse } from 'next/server';
import { codes } from '../send-code/route';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });

    const stored = codes.get(email);
    if (!stored) return NextResponse.json({ error: 'لم يتم إرسال رمز لهذا البريد' }, { status: 400 });
    if (Date.now() > stored.expires) { codes.delete(email); return NextResponse.json({ error: 'انتهت صلاحية الرمز' }, { status: 400 }); }
    if (stored.code !== code) return NextResponse.json({ error: 'رمز التحقق غير صحيح' }, { status: 400 });

    codes.delete(email);
    return NextResponse.json({ success: true, verified: true });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
