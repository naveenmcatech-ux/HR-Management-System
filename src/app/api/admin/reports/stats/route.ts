// app/api/admin/reports/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { 
  users, 
  employees, 
  attendance, 
  leaveRequests, 
  projects 
} from '@/lib/database/schema';
import { eq, and, count, sum } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total employees
    const totalEmployeesResult = await db
      .select({ count: count() })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(eq(users.isActive, true));

    // Active employees (not terminated)
    const activeEmployeesResult = await db
      .select({ count: count() })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .where(and(eq(users.isActive, true), eq(employees.status, 'active')));

    // Present today
    const presentTodayResult = await db
      .select({ count: count() })
      .from(attendance)
      .where(and(eq(attendance.date, today), eq(attendance.status, 'present')));

    // Pending leaves
    const pendingLeavesResult = await db
      .select({ count: count() })
      .from(leaveRequests)
      .where(eq(leaveRequests.status, 'pending'));

    // Active projects
    const activeProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, 'active'));

    // Monthly expenses (simplified - would come from payroll)
    const monthlyExpenses = totalEmployeesResult[0]?.count * 5000; // Mock calculation

    const stats = {
      totalEmployees: totalEmployeesResult[0]?.count || 0,
      activeEmployees: activeEmployeesResult[0]?.count || 0,
      presentToday: presentTodayResult[0]?.count || 0,
      pendingLeaves: pendingLeavesResult[0]?.count || 0,
      activeProjects: activeProjectsResult[0]?.count || 0,
      monthlyExpenses,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Report stats GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}