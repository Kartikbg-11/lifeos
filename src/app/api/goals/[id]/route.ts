import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateEnum, GOAL_TYPES, GOAL_CATEGORIES } from '@/lib/auth';

export async function PUT(
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
    const body = await request.json();

    // Check ownership
    const existing = await db.goal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Validate
    const errors: string[] = [];
    const {
      title,
      description,
      type,
      category,
      targetValue,
      unit,
      startDate,
      endDate,
      isCompleted,
    } = body;

    if (title !== undefined && (!title || title.trim() === '')) {
      errors.push('Title cannot be empty');
    }

    if (type !== undefined && validateEnum(type, GOAL_TYPES, 'type')) {
      errors.push(validateEnum(type, GOAL_TYPES, 'type')!);
    }

    if (category !== undefined && validateEnum(category, GOAL_CATEGORIES, 'category')) {
      errors.push(validateEnum(category, GOAL_CATEGORIES, 'category')!);
    }

    if (targetValue !== undefined && targetValue < 0) {
      errors.push('Target value must be non-negative');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Update goal
    const updateData: any = {};

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (targetValue !== undefined) updateData.targetValue = targetValue;
    if (unit !== undefined) updateData.unit = unit;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const goal = await db.goal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: goal });
  } catch (error) {
    console.error('Goals PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Check ownership
    const existing = await db.goal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Delete goal
    await db.goal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('Goals DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
