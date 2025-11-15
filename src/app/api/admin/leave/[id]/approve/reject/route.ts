// app/api/admin/leave/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { leaveRequests } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reason } = await request.json();
    const requestId = params.id;

    // Get the leave request
    const leaveRequest = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, requestId))
      .limit(1);

    if (leaveRequest.length === 0) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    if (leaveRequest[0].status !== 'pending') {
      return NextResponse.json(
        { error: 'Leave request is not pending' },
        { status: 400 }
      );
    }

    // Update leave request status to rejected
    await db
      .update(leaveRequests)
      .set({
        status: 'rejected',
        approvedBy: decoded.userId,
        approvedAt: new Date(),
        reason: reason || leaveRequest[0].reason,
      })
      .where(eq(leaveRequests.id, requestId));

    // In a real application, you would also:
    // 1. Send notification to employee with rejection reason
    // 2. Update any related records

    return NextResponse.json({
      success: true,
      message: 'Leave request rejected successfully',
    });
  } catch (error) {
    console.error('Leave reject PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}