import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stories, users, storyViews } from '@/db/schema';
import { eq, desc, gt, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get stories that haven't expired (24 hours)
    const now = new Date();

    const allStories = await db
      .select({
        id: stories.id,
        userId: stories.userId,
        mediaUrl: stories.mediaUrl,
        mediaType: stories.mediaType,
        caption: stories.caption,
        views: stories.views,
        createdAt: stories.createdAt,
        expiresAt: stories.expiresAt,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        isGoldMember: users.isGoldMember,
      })
      .from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(gt(stories.expiresAt, now))
      .orderBy(desc(stories.createdAt));

    // Group stories by user
    const groupedStories: Record<number, {
      user: {
        id: number;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
        isGoldMember: boolean | null;
      };
      stories: typeof allStories;
    }> = {};

    for (const story of allStories) {
      if (!groupedStories[story.userId]) {
        groupedStories[story.userId] = {
          user: {
            id: story.userId,
            username: story.username,
            displayName: story.displayName,
            avatarUrl: story.avatarUrl,
            isGoldMember: story.isGoldMember,
          },
          stories: [],
        };
      }
      groupedStories[story.userId].stories.push(story);
    }

    return NextResponse.json({ 
      stories: Object.values(groupedStories) 
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الحالات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, mediaUrl, mediaType, caption } = body;

    if (!userId || !mediaUrl || !mediaType) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    // Story expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const [newStory] = await db.insert(stories).values({
      userId,
      mediaUrl,
      mediaType,
      caption,
      expiresAt,
    }).returning();

    return NextResponse.json({ success: true, story: newStory });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحالة' },
      { status: 500 }
    );
  }
}
