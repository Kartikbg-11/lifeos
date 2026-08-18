import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

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
    const existing = await db.habit.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Validate and update
    const { name, description, icon, color, isActive } = body;

    const updateData: any = {};
    
    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update habit
    const habit = await db.habit.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: habit });
  } catch (error) {
    console.error('Habits PUT error:', error);
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
    const existing = await db.habit.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Delete habit (cascade will delete completions)
    await db.habit.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Habit deleted successfully',
    });
  } catch (error) {
    console.error('Habits DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
