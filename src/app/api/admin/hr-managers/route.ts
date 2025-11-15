// app/api/admin/hr-managers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { users, userProfiles, hrManagers, departments } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/utils';

// Demo/simple auth helper: accept either a Bearer token or the hrms-session cookie.
// In production, replace this with real token verification.
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
  const sessionCookie = request.cookies.get('hrms-session');

  if (token) {
    // try to verify JWT if available - but keep it optional for demo
    try {
      // dynamic import to avoid circular imports if verifyToken isn't available
      const { verifyToken } = await import('@/lib/auth/utils');
      const decoded = verifyToken(token);
      if (decoded) return decoded; // { id, role, email }
    } catch (e) {
      // fall through to cookie check
    }
  }

  if (sessionCookie) {
    // Session cookie set by the Admin login — treat as admin for demo
    return { id: '1', role: 'admin', email: 'admin@hrms.com' };
  }

  return null;
}

// GET - Fetch all HR managers
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hrManagersList = await db
      .select({
        id: hrManagers.id,
        userId: hrManagers.userId,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: users.email,
        phone: userProfiles.phone,
        departmentName: departments.name,
        departmentId: hrManagers.departmentId,
        permissions: hrManagers.permissions,
        isActive: hrManagers.isActive,
        createdAt: users.createdAt,
      })
      .from(hrManagers)
      .innerJoin(users, eq(hrManagers.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(departments, eq(hrManagers.departmentId, departments.id))
      .where(eq(users.role, 'hr'));

    return NextResponse.json({
      success: true,
      hrManagers: hrManagersList,
    });
  } catch (error) {
    console.error('HR Managers GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new HR manager
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      departmentId,
      permissions,
    } = await request.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !departmentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and HR manager in transaction
    const result = await db.transaction(async (tx) => {
      // Create user
      const [user] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role: 'hr',
          isActive: true,
        })
        .returning();

      // Create user profile
      await tx.insert(userProfiles).values({
        userId: user.id,
        firstName,
        lastName,
        phone,
      });

      // Create HR manager record
      const [hrManager] = await tx
        .insert(hrManagers)
        .values({
          userId: user.id,
          departmentId,
          permissions: permissions || {
            employeeManagement: true,
            attendanceManagement: true,
            leaveManagement: true,
            payrollView: true,
          },
          isActive: true,
        })
        .returning();

      return { user, hrManager };
    });

    return NextResponse.json({
      success: true,
      message: 'HR manager created successfully',
      hrManager: result,
    });
  } catch (error) {
    console.error('HR Manager POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
