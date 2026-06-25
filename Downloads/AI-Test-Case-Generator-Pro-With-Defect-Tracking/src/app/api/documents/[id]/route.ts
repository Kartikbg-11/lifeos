import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const document = await db.document.findUnique({
      where: { id },
      include: {
        requirements: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const document = await db.document.findUnique({ where: { id } })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    await db.document.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_DOCUMENT',
        entityType: 'Document',
        entityId: id,
        details: `Deleted document: ${document.name}`,
      },
    })

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}