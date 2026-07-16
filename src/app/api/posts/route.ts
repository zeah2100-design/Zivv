import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, users, likes, comments } from '@/db/schema';
import { eq, desc, and, sql, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: posts.id,
        userId: posts.userId,
        type: posts.type,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        thumbnailUrl: posts.thumbnailUrl,
        views: posts.views,
        createdAt: posts.createdAt,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        isGoldMember: users.isGoldMember,
        likesCount: sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id})`,
        commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(
        eq(posts.isDeleted, false),
        eq(posts.isApproved, true)
      ))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Apply filters
    const conditions = [
      eq(posts.isDeleted, false),
      eq(posts.isApproved, true)
    ];

    if (type && type !== 'all') {
      if (type === 'feed') {
        conditions.push(or(
          eq(posts.type, 'text'),
          eq(posts.type, 'image'),
          eq(posts.type, 'video')
        )!);
      } else if (type === 'shorts') {
        conditions.push(eq(posts.type, 'short_video'));
      } else if (type === 'music') {
        conditions.push(eq(posts.type, 'music'));
      } else {
        conditions.push(eq(posts.type, type as 'text' | 'image' | 'video' | 'short_video' | 'music'));
      }
    }

    if (userId) {
      conditions.push(eq(posts.userId, parseInt(userId)));
    }

    if (search) {
      conditions.push(ilike(posts.content, `%${search}%`));
    }

    const allPosts = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        type: posts.type,
        content: posts.content,
        mediaUrl: posts.mediaUrl,
        thumbnailUrl: posts.thumbnailUrl,
        views: posts.views,
        createdAt: posts.createdAt,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        isGoldMember: users.isGoldMember,
        likesCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id)`,
        commentsCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id)`,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ posts: allPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المنشورات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, content, mediaUrl, thumbnailUrl } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    // Content moderation - basic check for inappropriate words
    const inappropriateWords = ['سب', 'شتم', 'قذف'];
    const hasInappropriate = inappropriateWords.some(word => 
      content?.toLowerCase().includes(word)
    );

    const [newPost] = await db.insert(posts).values({
      userId,
      type,
      content,
      mediaUrl,
      thumbnailUrl,
      isApproved: !hasInappropriate,
    }).returning();

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المنشور' },
      { status: 500 }
    );
  }
}
