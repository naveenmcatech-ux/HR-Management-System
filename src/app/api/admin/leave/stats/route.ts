// app/api/admin/leave/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { leaveRequests, employees, users } from '@/lib/database/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
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
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Get total leave requests
    const totalRequestsResult = await db
      .select({ count: count() })
      .from(leaveRequests);

    // Get pending requests
    const pendingRequestsResult = await db
      .select({ count: count() })
      .from(leaveRequests)
      .where(eq(leaveRequests.status, 'pending'));

    // Get approved this month
    const approvedThisMonthResult = await db
      .select({ count: count() })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.status, 'approved'),
          gte(leaveRequests.createdAt, monthStart),
          lte(leaveRequests.createdAt, monthEnd)
        )
      );

    // Get rejected this month
    const rejectedThisMonthResult = await db
      .select({ count: count() })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.status, 'rejected'),
          gte(leaveRequests.createdAt, monthStart),
          lte(leaveRequests.createdAt, monthEnd)
        )
      );

    // Calculate leave balance (mock data - in real app, this would come from employee leave balances)
    const leaveBalance = {
      sick: 12,
      casual: 8,
      earned: 21,
    };

    const stats = {
      totalRequests: totalRequestsResult[0]?.count || 0,
      pendingRequests: pendingRequestsResult[0]?.count || 0,
      approvedThisMonth: approvedThisMonthResult[0]?.count || 0,
      rejectedThisMonth: rejectedThisMonthResult[0]?.count || 0,
      leaveBalance,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Leave stats GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}