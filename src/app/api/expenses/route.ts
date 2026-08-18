import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, getTodayInTimezone, validateRequired, validateEnum, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const categoryParam = searchParams.get('category');
    const paymentMethodParam = searchParams.get('paymentMethod');
    const limitParam = searchParams.get('limit');

    // Build where clause
    let whereClause: any = { userId: user.id };

    if (dateParam) {
      whereClause.date = dateParam;
    } else if (startDateParam && endDateParam) {
      whereClause.date = { gte: startDateParam, lte: endDateParam };
    } else if (startDateParam) {
      whereClause.date = { gte: startDateParam };
    }

    if (categoryParam) {
      whereClause.category = categoryParam;
    }

    if (paymentMethodParam) {
      whereClause.paymentMethod = paymentMethodParam;
    }

    // Fetch entries
    const entries = await db.expenseEntry.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limitParam ? parseInt(limitParam, 10) : undefined,
    });

    // Calculate totals
    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    // Group by category
    const byCategory = entries.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = { count: 0, total: 0 };
      }
      acc[entry.category].count++;
      acc[entry.category].total += entry.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Group by payment method
    const byPaymentMethod = entries.reduce((acc, entry) => {
      const method = entry.paymentMethod || 'unknown';
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      acc[method].total += entry.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return NextResponse.json({
      success: true,
      data: {
        entries,
        totals: {
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          count: entries.length,
          averagePerEntry: entries.length > 0 ? parseFloat((totalAmount / entries.length).toFixed(2)) : 0,
          byCategory,
          byPaymentMethod,
        },
      },
    });
  } catch (error) {
    console.error('Expenses GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      date,
      amount,
      category,
      reason,
      paymentMethod,
      notes,
    } = body;

    // Validate required fields
    const errors: string[] = [];

    if (amount === undefined || amount === null || amount <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (!category) {
      errors.push('Category is required');
    } else if (validateEnum(category, EXPENSE_CATEGORIES, 'category')) {
      errors.push(validateEnum(category, EXPENSE_CATEGORIES, 'category')!);
    }

    if (paymentMethod && validateEnum(paymentMethod, PAYMENT_METHODS, 'paymentMethod')) {
      errors.push(validateEnum(paymentMethod, PAYMENT_METHODS, 'paymentMethod')!);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const targetDate = date || getTodayInTimezone();

    // Create expense entry
    const entry = await db.expenseEntry.create({
      data: {
        userId: user.id,
        date: targetDate,
        amount: parseFloat(amount.toFixed(2)),
        category,
        reason: reason || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  } catch (error) {
    console.error('Expenses POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
