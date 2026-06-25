import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.appSetting.findMany({
      orderBy: { key: 'asc' },
    })

    // Convert to key-value object
    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }

    return NextResponse.json(settingsMap)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const settings = body.settings as Record<string, string>

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      await db.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: `Updated via settings API` },
      })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_SETTINGS',
        entityType: 'AppSetting',
        details: `Updated settings: ${Object.keys(settings).join(', ')}`,
      },
    })

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}