import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateEnum, MEAL_TYPES } from '@/lib/auth';

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
    const existing = await db.foodEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Validate
    const errors: string[] = [];
    const { mealType, foodName, quantity, calories, protein, carbohydrates, fat, notes } = body;

    if (mealType !== undefined && validateEnum(mealType, MEAL_TYPES, 'mealType')) {
      errors.push(validateEnum(mealType, MEAL_TYPES, 'mealType')!);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Update entry
    const entry = await db.foodEntry.update({
      where: { id },
      data: {
        ...(mealType !== undefined && { mealType }),
        ...(foodName !== undefined && { foodName: foodName.trim() }),
        ...(quantity !== undefined && { quantity }),
        ...(calories !== undefined && { calories }),
        ...(protein !== undefined && { protein }),
        ...(carbohydrates !== undefined && { carbohydrates }),
        ...(fat !== undefined && { fat }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Food PUT error:', error);
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
    const existing = await db.foodEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Delete entry
    await db.foodEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Food entry deleted successfully',
    });
  } catch (error) {
    console.error('Food DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
