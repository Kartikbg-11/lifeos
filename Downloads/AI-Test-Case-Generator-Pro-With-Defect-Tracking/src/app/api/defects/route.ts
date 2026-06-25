import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/defects?projectId=xxx&status=xxx&severity=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const priority = searchParams.get('priority');

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status && status !== 'ALL') where.status = status;
    if (severity && severity !== 'ALL') where.severity = severity;
    if (priority && priority !== 'ALL') where.priority = priority;

    const defects = await prisma.defect.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(defects);
  } catch (error) {
    console.error('Error fetching defects:', error);
    return NextResponse.json({ error: 'Failed to fetch defects' }, { status: 500 });
  }
}

// POST /api/defects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, severity, priority, projectId, testCaseId, stepsToReproduce, expectedBehavior, actualBehavior, environment, module, reportedById, assignedToId } = body;

    if (!title || !projectId || !reportedById) {
      return NextResponse.json({ error: 'Title, projectId, and reportedById are required' }, { status: 400 });
    }

    // Count existing defects to generate defect ID
    const count = await prisma.defect.count({ where: { projectId } });
    const defectId = `DEF-${String(count + 1).padStart(3, '0')}`;

    const defect = await prisma.defect.create({
      data: {
        defectId,
        title,
        description: description || '',
        severity: severity || 'MEDIUM',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        projectId,
        testCaseId: testCaseId || '',
        stepsToReproduce: stepsToReproduce || '',
        expectedBehavior: expectedBehavior || '',
        actualBehavior: actualBehavior || '',
        environment: environment || '',
        module: module || '',
        reportedById,
        assignedToId: assignedToId || null,
      },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json(defect, { status: 201 });
  } catch (error) {
    console.error('Error creating defect:', error);
    return NextResponse.json({ error: 'Failed to create defect' }, { status: 500 });
  }
}