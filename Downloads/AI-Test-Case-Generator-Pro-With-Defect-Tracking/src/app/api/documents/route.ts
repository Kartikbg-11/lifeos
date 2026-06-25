import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const documents = await db.document.findMany({
      ...(projectId ? { where: { projectId } } : {}),
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('List documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
