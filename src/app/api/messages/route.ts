import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, users } from '@/db/schema';
import { eq, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const friendId = searchParams.get('friendId');

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const uid = parseInt(userId);

    if (friendId) {
      // Get conversation with specific friend
      const fid = parseInt(friendId);
      const conversation = await db
        .select()
        .from(messages)
        .where(or(
          and(eq(messages.senderId, uid), eq(messages.receiverId, fid)),
          and(eq(messages.senderId, fid), eq(messages.receiverId, uid))
        ))
        .orderBy(messages.createdAt);

      // Mark as read
      await db.update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.senderId, fid),
          eq(messages.receiverId, uid),
          eq(messages.isRead, false)
        ));

      return NextResponse.json({ messages: conversation });
    } else {
      // Get list of conversations (latest message from each friend)
      const conversations = await db
        .select({
          id: messages.id,
          content: messages.content,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          createdAt: messages.createdAt,
          isRead: messages.isRead,
        })
        .from(messages)
        .where(or(
          eq(messages.senderId, uid),
          eq(messages.receiverId, uid)
        ))
        .orderBy(desc(messages.createdAt));

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, content, isProtected } = await request.json();

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    const [newMessage] = await db.insert(messages).values({
      senderId,
      receiverId,
      content,
      isProtected: isProtected || false,
    }).returning();

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
