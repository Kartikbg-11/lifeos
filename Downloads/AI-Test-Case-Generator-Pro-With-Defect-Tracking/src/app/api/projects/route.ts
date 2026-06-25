import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        createdBy: {
          select: { id: true, username: true, firstName: true, lastName: true },
        },
        members: {
          include: {
            user: { select: { id: true, username: true, firstName: true, lastName: true, role: true } },
          },
        },
        _count: {
          select: { documents: true, testCases: true, testScenarios: true, rtms: true, bugPredictions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('List projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, createdById, status } = body

    if (!name || !createdById) {
      return NextResponse.json({ error: 'Project name and creator ID are required' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name,
        description: description || '',
        status: status || 'ACTIVE',
        createdById,
      },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    })

    // Auto-add creator as project member
    await db.projectMember.create({
      data: {
        projectId: project.id,
        userId: createdById,
        roleInProject: 'ADMIN',
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE_PROJECT',
        entityType: 'Project',
        entityId: project.id,
        details: `Created project: ${name}`,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}