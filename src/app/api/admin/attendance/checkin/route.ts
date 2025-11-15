// app/api/admin/attendance/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { attendance, employees, attendanceSettings } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: any = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { timestamp } = await req.json();
    if (!timestamp) {
      return NextResponse.json({ error: 'Timestamp is required' }, { status: 400 });
    }

    const checkInTime = new Date(timestamp);
    const today = checkInTime.toISOString().split('T')[0];

    // Get employee record (support both userId and id)
    const userId = decoded.userId || decoded.id;
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    // Get attendance settings
    const [settings] = await db.select().from(attendanceSettings).limit(1);
    if (!settings) {
      return NextResponse.json({ error: 'Attendance settings not configured' }, { status: 500 });
    }

    // Check if already checked in today
    const [existingRecord] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, employee.id),
          eq(attendance.date, today)
        )
      )
      .limit(1);

    if (existingRecord && existingRecord.checkIn) {
      return NextResponse.json(
        {
          error: 'Already checked in today',
          attendance: existingRecord,
        },
        { status: 400 }
      );
    }

    // Parse check-in settings times
    const [checkInStartHour, checkInStartMinute] = settings.checkInStart
      .toString()
      .split(':')
      .map(Number);
    const checkInStartTotalMinutes = checkInStartHour * 60 + checkInStartMinute;

    // Get actual check-in time in minutes
    const checkInHours = checkInTime.getHours();
    const checkInMinutes = checkInTime.getMinutes();
    const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;

    // Calculate grace period and determine status
    const gracePeriod = settings.gracePeriod || 15;
    const lateThreshold = checkInStartTotalMinutes + gracePeriod;

    let status = 'present';
    let lateMinutes = 0;

    if (checkInTotalMinutes > lateThreshold) {
      status = 'late';
      lateMinutes = Math.round(checkInTotalMinutes - lateThreshold);
    }

    // Create or update attendance record
    if (existingRecord) {
      const [updated] = await db
        .update(attendance)
        .set({
          checkIn: checkInTime,
          status,
          lateMinutes,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existingRecord.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: `Checked in successfully${
          lateMinutes > 0 ? ` (${lateMinutes} minutes late)` : ' (On time)'
        }`,
        attendance: updated,
      });
    } else {
      const [newRecord] = await db
        .insert(attendance)
        .values({
          employeeId: employee.id,
          date: today,
          checkIn: checkInTime,
          status,
          lateMinutes,
          workHours: '0',
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: `Checked in successfully${
          lateMinutes > 0 ? ` (${lateMinutes} minutes late)` : ' (On time)'
        }`,
        attendance: newRecord,
      });
    }
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check in',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
