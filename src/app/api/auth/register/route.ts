import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, validateAge } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, birthDate, verificationCode } = await request.json();

    if (!username || !email || !password || !birthDate) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    // Validate age
    if (!validateAge(new Date(birthDate))) {
      return NextResponse.json({ error: 'يجب أن يكون عمرك 18 سنة على الأقل' }, { status: 400 });
    }

    // Check existing
    const [existingEmail] = await db.select().from(users).where(eq(users.email, email));
    if (existingEmail) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

    const [existingUsername] = await db.select().from(users).where(eq(users.username, username));
    if (existingUsername) {
      return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 400 });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      birthDate: new Date(birthDate),
      displayName: username,
      isVerified: !!verificationCode, // verified if code was provided
    }).returning();

    const { password: _, verificationCode: __, verificationExpires: ___, ...userSafe } = newUser;
    return NextResponse.json({ success: true, user: userSafe });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التسجيل' }, { status: 500 });
  }
}
