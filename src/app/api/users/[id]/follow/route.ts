import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { followers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetUserId = parseInt(id);
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'لا يمكنك متابعة نفسك' },
        { status: 400 }
      );
    }

    // Check if already following
    const [existing] = await db.select().from(followers)
      .where(and(
        eq(followers.followerId, userId),
        eq(followers.followingId, targetUserId)
      ));

    if (existing) {
      // Unfollow
      await db.delete(followers)
        .where(and(
          eq(followers.followerId, userId),
          eq(followers.followingId, targetUserId)
        ));
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await db.insert(followers).values({
        followerId: userId,
        followingId: targetUserId,
      });
      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
