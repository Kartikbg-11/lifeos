import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const testCases = await db.testCase.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(testCases)
  } catch (error) {
    console.error('List test cases error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId, documentId, scenarioId, requirementId, tcId, module, title,
      preconditions, testData, steps, expectedResult, priority, severity,
      type, automationCandidate, automationReason, status, createdById,
    } = body

    if (!projectId || !title) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 })
    }

    const testCase = await db.testCase.create({
      data: {
        projectId,
        documentId: documentId || '',
        scenarioId: scenarioId || '',
        requirementId: requirementId || '',
        tcId: tcId || '',
        module: module || '',
        title,
        preconditions: preconditions || '',
        testData: testData || '',
        steps: steps || '',
        expectedResult: expectedResult || '',
        priority: priority || 'MEDIUM',
        severity: severity || 'MODERATE',
        type: type || 'POSITIVE',
        automationCandidate: automationCandidate || 'MANUAL_ONLY',
        automationReason: automationReason || '',
        status: status || 'DRAFT',
        createdById: createdById || undefined,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: createdById || undefined,
        action: 'CREATE_TEST_CASE',
        entityType: 'TestCase',
        entityId: testCase.id,
        details: `Created test case: ${title}`,
      },
    })

    return NextResponse.json(testCase, { status: 201 })
  } catch (error) {
    console.error('Create test case error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}