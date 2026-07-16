import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    // Increment views
    await db.update(posts)
      .set({ views: sql`COALESCE(${posts.views}, 0) + 1` })
      .where(eq(posts.id, postId));

    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    if (!post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id);
    const { userId, isAdmin } = await request.json();

    const [post] = await db.select().from(posts).where(eq(posts.id, postId));

    if (!post) {
      return NextResponse.json(
        { error: 'المنشور غير موجود' },
        { status: 404 }
      );
    }

    // Check permission
    if (post.userId !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح لك بحذف هذا المنشور' },
        { status: 403 }
      );
    }

    await db.update(posts)
      .set({ isDeleted: true })
      .where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
