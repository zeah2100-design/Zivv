import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const [user] = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      coverUrl: users.coverUrl,
      isGoldMember: users.isGoldMember,
      createdAt: users.createdAt,
      followersCount: sql<number>`(SELECT COUNT(*)::int FROM followers WHERE followers.following_id = ${users.id})`,
      followingCount: sql<number>`(SELECT COUNT(*)::int FROM followers WHERE followers.follower_id = ${users.id})`,
      postsCount: sql<number>`(SELECT COUNT(*)::int FROM posts WHERE posts.user_id = ${users.id} AND posts.is_deleted = false)`,
    }).from(users).where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const updates = await request.json();

    delete updates.password;
    delete updates.isAdmin;
    delete updates.id;

    const [updatedUser] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
