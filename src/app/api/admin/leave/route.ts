// app/api/admin/leave/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { leaveRequests, employees, userProfiles, departments, users } from '@/lib/database/schema';
import { eq, and, gte, lte, desc, SQL } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

// GET - Fetch leave requests
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const date = searchParams.get('date');

    const whereConditions: (SQL | undefined)[] = [];

    if (status) {
      whereConditions.push(eq(leaveRequests.status, status));
    }

    if (type) {
      whereConditions.push(eq(leaveRequests.leaveType, type));
    }

    if (date) {
      const [year, month] = date.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      whereConditions.push(
        and(
          gte(leaveRequests.startDate, startDate),
          lte(leaveRequests.startDate, endDate)
        )
      );
    }

    const leaveRequestsList = await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: users.email,
        departmentName: departments.name,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        days: leaveRequests.days,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        createdAt: leaveRequests.createdAt,
      })
      .from(leaveRequests)
      .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(and(...whereConditions))
      .orderBy(desc(leaveRequests.createdAt));

    return NextResponse.json({
      success: true,
      leaveRequests: leaveRequestsList,
    });
  } catch (error) {
    console.error('Leave requests GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
