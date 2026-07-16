import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetUserId = parseInt(id);
    const { adminId, action } = await request.json();

    // Verify admin
    const [admin] = await db.select().from(users).where(eq(users.id, adminId));
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح لك' },
        { status: 403 }
      );
    }

    const isBanned = action === 'ban';

    await db.update(users)
      .set({ isBanned })
      .where(eq(users.id, targetUserId));

    return NextResponse.json({ 
      success: true, 
      message: isBanned ? 'تم حظر المستخدم' : 'تم إلغاء حظر المستخدم' 
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
