import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, validateEnum, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/auth';

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
    const existing = await db.expenseEntry.findFirst({
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
    const { amount, category, reason, paymentMethod, notes } = body;

    if (amount !== undefined && (amount <= 0 || typeof amount !== 'number')) {
      errors.push('Amount must be a positive number');
    }

    if (category !== undefined && validateEnum(category, EXPENSE_CATEGORIES, 'category')) {
      errors.push(validateEnum(category, EXPENSE_CATEGORIES, 'category')!);
    }

    if (paymentMethod !== undefined && validateEnum(paymentMethod, PAYMENT_METHODS, 'paymentMethod')) {
      errors.push(validateEnum(paymentMethod, PAYMENT_METHODS, 'paymentMethod')!);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Update entry
    const entry = await db.expenseEntry.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount.toFixed(2)) }),
        ...(category !== undefined && { category }),
        ...(reason !== undefined && { reason }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Expenses PUT error:', error);
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
    const existing = await db.expenseEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Delete entry
    await db.expenseEntry.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Expense entry deleted successfully',
    });
  } catch (error) {
    console.error('Expenses DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
