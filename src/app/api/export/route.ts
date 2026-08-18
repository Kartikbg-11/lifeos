import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/export - Export all user data as JSON
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
    const format = searchParams.get('format') || 'json'; // Future support for csv
    const includeParam = searchParams.get('include'); // Comma-separated list of modules

    // Parse which modules to include (default: all)
    const allModules = [
      'profile',
      'fitness',
      'learning',
      'interview',
      'sleep',
      'food',
      'water',
      'expenses',
      'habits',
      'goals',
      'journal',
      'dailyEntries',
      'reminders',
    ];

    let modulesToExport = allModules;
    if (includeParam) {
      const requestedModules = includeParam.split(',').map((m) => m.trim());
      modulesToExport = allModules.filter((m) => requestedModules.includes(m));
    }

    // Fetch all user data in parallel based on requested modules
    const fetchPromises: Promise<any>[] = [];

    // Always include profile info for context
    const profilePromise = db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        workoutGoal: true,
        pushupGoal: true,
        learningGoal: true,
        interviewGoal: true,
        sleepGoal: true,
        waterGoal: true,
        proteinGoal: true,
        currency: true,
        timezone: true,
      },
    });
    fetchPromises.push(profilePromise);

    if (modulesToExport.includes('fitness')) {
      fetchPromises.push(
        db.fitnessEntry.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ fitness: data }))
      );
    }

    if (modulesToExport.includes('learning')) {
      fetchPromises.push(
        db.learningSession.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ learning: data }))
      );
    }

    if (modulesToExport.includes('interview')) {
      fetchPromises.push(
        db.interviewSession.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ interview: data }))
      );
    }

    if (modulesToExport.includes('sleep')) {
      fetchPromises.push(
        db.sleepEntry.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ sleep: data }))
      );
    }

    if (modulesToExport.includes('food')) {
      fetchPromises.push(
        db.foodEntry.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ food: data }))
      );
    }

    if (modulesToExport.includes('water')) {
      fetchPromises.push(
        db.waterEntry.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ water: data }))
      );
    }

    if (modulesToExport.includes('expenses')) {
      fetchPromises.push(
        db.expenseEntry.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ expenses: data }))
      );
    }

    if (modulesToExport.includes('habits')) {
      fetchPromises.push(
        Promise.all([
          db.habit.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
          }),
          db.habitCompletion.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
          }),
        ]).then(([habits, completions]) => ({ habits, habitCompletions: completions }))
      );
    }

    if (modulesToExport.includes('goals')) {
      fetchPromises.push(
        db.goal.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        }).then((data) => ({ goals: data }))
      );
    }

    if (modulesToExport.includes('journal')) {
      fetchPromises.push(
        db.journalEntry.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ journal: data }))
      );
    }

    if (modulesToExport.includes('dailyEntries')) {
      fetchPromises.push(
        db.dailyEntry.findMany({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
        }).then((data) => ({ dailyEntries: data }))
      );
    }

    if (modulesToExport.includes('reminders')) {
      fetchPromises.push(
        db.reminder.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        }).then((data) => ({ reminders: data }))
      );
    }

    // Wait for all promises to resolve
    const results = await Promise.all(fetchPromises);

    // Build export object
    const exportData: any = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      app: 'LIFEOS',
      profile: results[0], // First result is always profile
    };

    // Merge remaining results
    for (let i = 1; i < results.length; i++) {
      Object.assign(exportData, results[i]);
    }

    // Calculate summary stats
    exportData.summary = {
      totalFitnessEntries: exportData.fitness?.length || 0,
      totalLearningSessions: exportData.learning?.length || 0,
      totalInterviewSessions: exportData.interview?.length || 0,
      totalSleepEntries: exportData.sleep?.length || 0,
      totalFoodEntries: exportData.food?.length || 0,
      totalWaterEntries: exportData.water?.length || 0,
      totalExpenseEntries: exportData.expenses?.length || 0,
      totalHabits: exportData.habits?.length || 0,
      totalHabitCompletions: exportData.habitCompletions?.length || 0,
      totalGoals: exportData.goals?.length || 0,
      totalJournalEntries: exportData.journal?.length || 0,
      totalReminders: exportData.reminders?.length || 0,
    };

    // Return as downloadable file
    if (format === 'json') {
      const jsonString = JSON.stringify(exportData, null, 2);
      
      return new NextResponse(jsonString, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="lifeos-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Default fallback
    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
