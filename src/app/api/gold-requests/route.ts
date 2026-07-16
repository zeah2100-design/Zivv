import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goldRequests, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const requests = await db
      .select({
        id: goldRequests.id,
        userId: goldRequests.userId,
        status: goldRequests.status,
        message: goldRequests.message,
        createdAt: goldRequests.createdAt,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(goldRequests)
      .innerJoin(users, eq(goldRequests.userId, users.id))
      .where(eq(goldRequests.status, status as 'pending' | 'approved' | 'rejected'))
      .orderBy(desc(goldRequests.createdAt));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching gold requests:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, message } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Check if user already has a pending request
    const [existing] = await db.select().from(goldRequests)
      .where(eq(goldRequests.userId, userId));

    if (existing && existing.status === 'pending') {
      return NextResponse.json(
        { error: 'لديك طلب قيد المراجعة بالفعل' },
        { status: 400 }
      );
    }

    const [newRequest] = await db.insert(goldRequests).values({
      userId,
      message,
    }).returning();

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error creating gold request:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
