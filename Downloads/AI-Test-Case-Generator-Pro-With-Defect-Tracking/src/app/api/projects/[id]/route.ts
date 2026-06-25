import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await db.project.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        members: {
          include: { user: { select: { id: true, username: true, firstName: true, lastName: true, role: true } } },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        testScenarios: { orderBy: { createdAt: 'desc' } },
        _count: { select: { testCases: true, rtms: true, bugPredictions: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Get project error:', error)
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
    const { name, description, status } = body

    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updated = await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_PROJECT',
        entityType: 'Project',
        entityId: id,
        details: `Updated project: ${name || project.name}`,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await db.project.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_PROJECT',
        entityType: 'Project',
        entityId: id,
        details: `Deleted project: ${project.name}`,
      },
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}