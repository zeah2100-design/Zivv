import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { friendships } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);
    const { action } = await request.json();

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'إجراء غير صالح' },
        { status: 400 }
      );
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    const [updated] = await db.update(friendships)
      .set({ status: newStatus })
      .where(eq(friendships.id, requestId))
      .returning();

    return NextResponse.json({ success: true, friendship: updated });
  } catch (error) {
    console.error('Error updating friendship:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
