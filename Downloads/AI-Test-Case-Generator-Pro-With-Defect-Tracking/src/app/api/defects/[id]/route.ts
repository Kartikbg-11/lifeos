import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/defects/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const defect = await prisma.defect.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!defect) {
      return NextResponse.json({ error: 'Defect not found' }, { status: 404 });
    }

    return NextResponse.json(defect);
  } catch (error) {
    console.error('Error fetching defect:', error);
    return NextResponse.json({ error: 'Failed to fetch defect' }, { status: 500 });
  }
}

// PUT /api/defects/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = { ...body };
    // Remove fields that should not be updated directly
    delete updateData.id;
    delete updateData.defectId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Auto-set resolvedAt when status changes to CLOSED or VERIFIED
    if (body.status === 'CLOSED' || body.status === 'VERIFIED') {
      updateData.resolvedAt = new Date();
    } else if (body.status === 'REOPENED') {
      updateData.resolvedAt = null;
    }

    const defect = await prisma.defect.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json(defect);
  } catch (error) {
    console.error('Error updating defect:', error);
    return NextResponse.json({ error: 'Failed to update defect' }, { status: 500 });
  }
}

// DELETE /api/defects/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.defect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting defect:', error);
    return NextResponse.json({ error: 'Failed to delete defect' }, { status: 500 });
  }
}