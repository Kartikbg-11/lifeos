import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testCase = await db.testCase.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
      },
    })

    if (!testCase) {
      return NextResponse.json({ error: 'Test case not found' }, { status: 404 })
    }

    return NextResponse.json(testCase)
  } catch (error) {
    console.error('Get test case error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.testCase.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Test case not found' }, { status: 404 })
    }

    const updatableFields = [
      'title', 'module', 'preconditions', 'testData', 'steps', 'expectedResult',
      'actualResult', 'priority', 'severity', 'type', 'automationCandidate',
      'automationReason', 'status', 'scenarioId', 'requirementId', 'tcId', 'documentId',
    ]

    const updateData: Record<string, string> = {}
    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const testCase = await db.testCase.update({
      where: { id },
      data: updateData,
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_TEST_CASE',
        entityType: 'TestCase',
        entityId: id,
        details: `Updated test case: ${existing.title}`,
      },
    })

    return NextResponse.json(testCase)
  } catch (error) {
    console.error('Update test case error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.testCase.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Test case not found' }, { status: 404 })
    }

    await db.testCase.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_TEST_CASE',
        entityType: 'TestCase',
        entityId: id,
        details: `Deleted test case: ${existing.title}`,
      },
    })

    return NextResponse.json({ message: 'Test case deleted successfully' })
  } catch (error) {
    console.error('Delete test case error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}