import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/settings - Get user settings
export async function GET() {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get full user data with all settings
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        // Goals/Targets
        workoutGoal: true,
        pushupGoal: true,
        learningGoal: true,
        interviewGoal: true,
        sleepGoal: true,
        waterGoal: true,
        proteinGoal: true,
        // Preferences
        currency: true,
        timezone: true,
      },
    });

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Destructure allowed fields
    const {
      name,
      // Goals/Targets
      workoutGoal,
      pushupGoal,
      learningGoal,
      interviewGoal,
      sleepGoal,
      waterGoal,
      proteinGoal,
      // Preferences
      currency,
      timezone,
    } = body;

    // Build update data object
    const updateData: Record<string, any> = {};

    // Name validation
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Name must be a string' },
          { status: 400 }
        );
      }
      updateData.name = name.trim() || null;
    }

    // Goal validations (must be positive integers)
    const goalFields = [
      { field: 'workoutGoal', value: workoutGoal },
      { field: 'pushupGoal', value: pushupGoal },
      { field: 'learningGoal', value: learningGoal },
      { field: 'interviewGoal', value: interviewGoal },
      { field: 'sleepGoal', value: sleepGoal },
      { field: 'waterGoal', value: waterGoal },
      { field: 'proteinGoal', value: proteinGoal },
    ];

    for (const { field, value } of goalFields) {
      if (value !== undefined) {
        if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
          return NextResponse.json(
            { success: false, error: `${field} must be a positive integer` },
            { status: 400 }
          );
        }
        updateData[field] = value;
      }
    }

    // Currency validation
    if (currency !== undefined) {
      if (typeof currency !== 'string' || currency.length > 5) {
        return NextResponse.json(
          { success: false, error: 'Currency must be a string (max 5 characters)' },
          { status: 400 }
        );
      }
      updateData.currency = currency;
    }

    // Timezone validation
    if (timezone !== undefined) {
      const validTimezones = [
        'Asia/Kolkata',
        'America/New_York',
        'America/Los_Angeles',
        'Europe/London',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
        'UTC',
      ];
      
      if (!validTimezones.includes(timezone)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid timezone. Valid options: ${validTimezones.join(', ')}` 
          },
          { status: 400 }
        );
      }
      updateData.timezone = timezone;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update user settings
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        workoutGoal: true,
        pushupGoal: true,
        learningGoal: true,
        interviewGoal: true,
        sleepGoal: true,
        waterGoal: true,
        proteinGoal: true,
        currency: true,
        timezone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
