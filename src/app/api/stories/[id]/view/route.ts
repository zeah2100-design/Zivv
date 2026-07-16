import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stories, storyViews } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);
    const { viewerId } = await request.json();

    if (!viewerId) {
      return NextResponse.json({ success: true }); // Anonymous view
    }

    // Check if already viewed
    const [existing] = await db.select().from(storyViews)
      .where(and(
        eq(storyViews.storyId, storyId),
        eq(storyViews.viewerId, viewerId)
      ));

    if (!existing) {
      // Add view
      await db.insert(storyViews).values({
        storyId,
        viewerId,
      });

      // Increment view count
      await db.update(stories)
        .set({ views: sql`COALESCE(${stories.views}, 0) + 1` })
        .where(eq(stories.id, storyId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording story view:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
