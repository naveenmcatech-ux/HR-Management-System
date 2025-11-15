// app/api/admin/attendance/manual/route.ts
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

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { employeeId, date, checkIn, checkOut, notes } = await req.json();

    // Validate required fields
    if (!employeeId || !date || !checkIn || !checkOut) {
      return NextResponse.json({ 
        error: 'Employee, date, check-in, and check-out times are required' 
      }, { status: 400 });
    }

    // Get attendance settings
    const [settings] = await db.select().from(attendanceSettings).limit(1);
    if (!settings) {
      return NextResponse.json({ error: 'Attendance settings not configured' }, { status: 500 });
    }

    // Create full timestamps
    const checkInTimestamp = new Date(`${date}T${checkIn}`);
    const checkOutTimestamp = new Date(`${date}T${checkOut}`);

    // Calculate work hours
    const workMilliseconds = checkOutTimestamp.getTime() - checkInTimestamp.getTime();
    const workHours = workMilliseconds / (1000 * 60 * 60);
    const requiredWorkHours = parseFloat(settings.workHours.toString());

    // Calculate status
    const checkInHours = checkInTimestamp.getHours();
    const checkInMinutes = checkInTimestamp.getMinutes();
    const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;

    const [checkInStartHour, checkInStartMinute] = settings.checkInStart.split(':').map(Number);
    const checkInStartTotalMinutes = checkInStartHour * 60 + checkInStartMinute;

    const gracePeriod = settings.gracePeriod || 15;
    const lateThreshold = checkInStartTotalMinutes + gracePeriod;

    let status = 'present';
    let lateMinutes = 0;
    let earlyCheckout = false;
    let overtimeMinutes = 0;

    // Check if late
    if (checkInTotalMinutes > lateThreshold) {
      status = 'late';
      lateMinutes = checkInTotalMinutes - lateThreshold;
    }

    // Check for half day
    if (workHours < requiredWorkHours - 2) {
      status = 'half_day';
      earlyCheckout = true;
    }

    // Calculate overtime
    if (workHours > requiredWorkHours) {
      overtimeMinutes = Math.round((workHours - requiredWorkHours) * 60);
    }

    // Check for existing record
    const [existingRecord] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.employeeId, employeeId),
          eq(attendance.date, date)
        )
      )
      .limit(1);

    if (existingRecord) {
      // Update existing record
      const [updated] = await db
        .update(attendance)
        .set({
          checkIn: checkInTimestamp,
          checkOut: checkOutTimestamp,
          workHours: workHours.toFixed(2),
          status,
          lateMinutes,
          earlyCheckout,
          overtimeMinutes,
          notes,
          isManualEntry: true,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existingRecord.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Attendance record updated successfully',
        attendance: updated,
      });
    } else {
      // Create new record
      const [created] = await db
        .insert(attendance)
        .values({
          employeeId,
          date,
          checkIn: checkInTimestamp,
          checkOut: checkOutTimestamp,
          workHours: workHours.toFixed(2),
          status,
          lateMinutes,
          earlyCheckout,
          overtimeMinutes,
          notes,
          isManualEntry: true,
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'Attendance record created successfully',
        attendance: created,
      });
    }
  } catch (error) {
    console.error('Manual attendance entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}