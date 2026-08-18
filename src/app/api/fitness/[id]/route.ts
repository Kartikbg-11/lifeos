import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateEnum, WORKOUT_TYPES } from '@/lib/auth';

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
    const existing = await db.fitnessEntry.findFirst({
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
    const { workoutType, workoutDuration, pushups, squats, pullups, otherExercises, caloriesBurned, completed, notes } = body;

    if (workoutType !== undefined && validateEnum(workoutType, WORKOUT_TYPES, 'workoutType')) {
      errors.push(validateEnum(workoutType, WORKOUT_TYPES, 'workoutType')!);
    }

    if (workoutDuration !== undefined && workoutDuration < 0) {
      errors.push('workoutDuration must be non-negative');
    }

    if (pushups !== undefined && pushups < 0) {
      errors.push('pushups must be non-negative');
    }

    if (squats !== undefined && squats < 0) {
      errors.push('squats must be non-negative');
    }

    if (pullups !== undefined && pullups < 0) {
      errors.push('pullups must be non-negative');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Update entry
    const entry = await db.fitnessEntry.update({
      where: { id },
      data: {
        ...(workoutDuration !== undefined && { workoutDuration }),
        ...(workoutType !== undefined && { workoutType }),
        ...(pushups !== undefined && { pushups }),
        ...(squats !== undefined && { squats }),
        ...(pullups !== undefined && { pullups }),
        ...(otherExercises !== undefined && { otherExercises }),
        ...(caloriesBurned !== undefined && { caloriesBurned }),
        ...(completed !== undefined && { completed }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Fitness PUT error:', error);
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
    const existing = await db.fitnessEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Delete entry
    await db.fitnessEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Fitness entry deleted successfully',
    });
  } catch (error) {
    console.error('Fitness DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
