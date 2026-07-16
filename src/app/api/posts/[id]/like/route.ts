import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { likes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    // Check if already liked
    const [existingLike] = await db.select().from(likes)
      .where(and(
        eq(likes.postId, postId),
        eq(likes.userId, userId)
      ));

    if (existingLike) {
      // Unlike
      await db.delete(likes)
        .where(and(
          eq(likes.postId, postId),
          eq(likes.userId, userId)
        ));
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.insert(likes).values({
        postId,
        userId,
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
