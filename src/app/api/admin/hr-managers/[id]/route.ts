// app/api/admin/hr-managers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, hrManagers } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

// Demo/simple auth helper: accept either a Bearer token or the hrms-session cookie
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
  const sessionCookie = request.cookies.get('hrms-session');

  if (token) {
    try {
      const { verifyToken } = await import('@/lib/auth/utils');
      const decoded = verifyToken(token);
      if (decoded) return decoded;
    } catch (e) {
      // fall through to cookie check
    }
  }

  if (sessionCookie) {
    return { id: '1', role: 'admin', email: 'admin@hrms.com' };
  }

  return null;
}

// GET - Fetch single HR manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hrId = id;

    const hrManagerData = await db
      .select({
        id: hrManagers.id,
        userId: hrManagers.userId,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: users.email,
        phone: userProfiles.phone,
        departmentId: hrManagers.departmentId,
        permissions: hrManagers.permissions,
        isActive: hrManagers.isActive,
        createdAt: users.createdAt,
      })
      .from(hrManagers)
      .innerJoin(users, eq(hrManagers.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(hrManagers.id, hrId))
      .limit(1);

    if (hrManagerData.length === 0) {
      return NextResponse.json(
        { error: 'HR manager not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      hrManager: hrManagerData[0],
    });
  } catch (error) {
    console.error('HR Manager GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update HR manager
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, phone, departmentId, permissions, isActive } =
      await request.json();
    const { id } = await params;
    const hrId = id;

    // Get HR manager's user ID
    const hrManager = await db
      .select()
      .from(hrManagers)
      .where(eq(hrManagers.id, hrId))
      .limit(1);

    if (hrManager.length === 0) {
      return NextResponse.json(
        { error: 'HR manager not found' },
        { status: 404 }
      );
    }

    // Update in transaction
    await db.transaction(async (tx) => {
      const userId = hrManager[0].userId;
      if (!userId) {
        throw new Error('HR manager has no associated user');
      }

      // Update profile
      if (firstName || lastName || phone) {
        await tx
          .update(userProfiles)
          .set({
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(phone && { phone }),
          })
          .where(eq(userProfiles.userId, userId));
      }

      // Update HR manager
      const updateData: any = {};
      if (departmentId) updateData.departmentId = departmentId;
      if (permissions) updateData.permissions = permissions;
      if (isActive !== undefined) updateData.isActive = isActive;

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(hrManagers)
          .set(updateData)
          .where(eq(hrManagers.id, hrId));
      }

      // Update user active status if provided
      if (isActive !== undefined) {
        await tx
          .update(users)
          .set({ isActive })
          .where(eq(users.id, userId));
      }
    });

    return NextResponse.json({
      success: true,
      message: 'HR manager updated successfully',
    });
  } catch (error) {
    console.error('HR Manager PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate HR manager
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hrId = id;

    // Get HR manager's user ID
    const hrManager = await db
      .select()
      .from(hrManagers)
      .where(eq(hrManagers.id, hrId))
      .limit(1);

    if (hrManager.length === 0) {
      return NextResponse.json(
        { error: 'HR manager not found' },
        { status: 404 }
      );
    }

    // Deactivate user and HR manager
    await db.transaction(async (tx) => {
      const userId = hrManager[0].userId;
      if (!userId) {
        throw new Error('HR manager has no associated user');
      }

      await tx
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, userId));

      await tx
        .update(hrManagers)
        .set({ isActive: false })
        .where(eq(hrManagers.id, hrId));
    });

    return NextResponse.json({
      success: true,
      message: 'HR manager deactivated successfully',
    });
  } catch (error) {
    console.error('HR Manager DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}