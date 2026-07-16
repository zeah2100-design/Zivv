import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goldRequests, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id);
    const { action, adminId } = await request.json();

    // Verify admin
    const [admin] = await db.select().from(users).where(eq(users.id, adminId));
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح لك' },
        { status: 403 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'إجراء غير صالح' },
        { status: 400 }
      );
    }

    // Get the request
    const [goldRequest] = await db.select().from(goldRequests)
      .where(eq(goldRequests.id, requestId));

    if (!goldRequest) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update request status
    await db.update(goldRequests)
      .set({ 
        status: newStatus,
        reviewedAt: new Date()
      })
      .where(eq(goldRequests.id, requestId));

    // If approved, update user's gold status
    if (action === 'approve') {
      await db.update(users)
        .set({ isGoldMember: true })
        .where(eq(users.id, goldRequest.userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating gold request:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
