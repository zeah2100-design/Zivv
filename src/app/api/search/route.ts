import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, users } from '@/db/schema';
import { ilike, or, eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // all, users, posts

    if (!query) {
      return NextResponse.json({ users: [], posts: [] });
    }

    const results: { users?: unknown[]; posts?: unknown[] } = {};

    if (type === 'all' || type === 'users') {
      const foundUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          isGoldMember: users.isGoldMember,
        })
        .from(users)
        .where(or(
          ilike(users.username, `%${query}%`),
          ilike(users.displayName, `%${query}%`)
        ))
        .limit(20);

      results.users = foundUsers;
    }

    if (type === 'all' || type === 'posts') {
      const foundPosts = await db
        .select({
          id: posts.id,
          content: posts.content,
          type: posts.type,
          mediaUrl: posts.mediaUrl,
          createdAt: posts.createdAt,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(and(
          ilike(posts.content, `%${query}%`),
          eq(posts.isDeleted, false),
          eq(posts.isApproved, true)
        ))
        .orderBy(desc(posts.createdAt))
        .limit(20);

      results.posts = foundPosts;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء البحث' },
      { status: 500 }
    );
  }
}
