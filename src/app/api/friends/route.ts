import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { friendships, users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'pending';

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const uid = parseInt(userId);

    if (status === 'pending') {
      // Get pending friend requests received
      const requests = await db
        .select({
          id: friendships.id,
          senderId: friendships.senderId,
          createdAt: friendships.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(friendships)
        .innerJoin(users, eq(friendships.senderId, users.id))
        .where(and(
          eq(friendships.receiverId, uid),
          eq(friendships.status, 'pending')
        ));

      return NextResponse.json({ requests });
    } else {
      // Get accepted friends
      const friends = await db
        .select({
          id: friendships.id,
          friendId: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(friendships)
        .innerJoin(users, or(
          and(eq(friendships.senderId, uid), eq(users.id, friendships.receiverId)),
          and(eq(friendships.receiverId, uid), eq(users.id, friendships.senderId))
        ))
        .where(eq(friendships.status, 'accepted'));

      return NextResponse.json({ friends });
    }
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId } = await request.json();

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    // Check if request already exists
    const [existing] = await db.select().from(friendships)
      .where(or(
        and(eq(friendships.senderId, senderId), eq(friendships.receiverId, receiverId)),
        and(eq(friendships.senderId, receiverId), eq(friendships.receiverId, senderId))
      ));

    if (existing) {
      return NextResponse.json(
        { error: 'طلب الصداقة موجود بالفعل' },
        { status: 400 }
      );
    }

    const [newRequest] = await db.insert(friendships).values({
      senderId,
      receiverId,
      status: 'pending',
    }).returning();

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
