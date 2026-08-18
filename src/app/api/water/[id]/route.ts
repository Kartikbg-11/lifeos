import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check ownership and get entry for date info
    const existing = await db.waterEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    const entryDate = existing.date;

    // Delete entry
    await db.waterEntry.delete({
      where: { id },
    });

    // Get updated total for the day
    const remainingEntries = await db.waterEntry.findMany({
      where: { userId: user.id, date: entryDate },
    });
    
    const totalMl = remainingEntries.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      success: true,
      message: 'Water entry deleted successfully',
      dayTotal: {
        totalMl,
        glassCount: Math.floor(totalMl / 250),
      },
    });
  } catch (error) {
    console.error('Water DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
