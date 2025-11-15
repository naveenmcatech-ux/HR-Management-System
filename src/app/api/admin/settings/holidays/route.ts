// app/api/admin/settings/holidays/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { holidays } from '@/lib/database/schema';
import { desc, eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// GET - Fetch all holidays
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const holidaysList = await db
      .select()
      .from(holidays)
      .orderBy(desc(holidays.date));

    return NextResponse.json({
      success: true,
      holidays: holidaysList,
    });
  } catch (error) {
    console.error('Holidays GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new holiday
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, date, description, isRecurring } = await request.json();

    // Validate required fields
    if (!name || !date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 }
      );
    }

    // Check if holiday already exists on this date
    const existingHoliday = await db
      .select()
      .from(holidays)
      .where(eq(holidays.date, new Date(date)))
      .limit(1);

    if (existingHoliday.length > 0) {
      return NextResponse.json(
        { error: 'Holiday already exists on this date' },
        { status: 400 }
      );
    }

    // Create holiday
    const [holiday] = await db
      .insert(holidays)
      .values({
        name,
        date: new Date(date),
        description: description || '',
        isRecurring: isRecurring || false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Holiday created successfully',
      holiday,
    });
  } catch (error) {
    console.error('Holiday POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
