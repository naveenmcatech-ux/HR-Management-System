// app/api/admin/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { employees, users, userProfiles, userRoles } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  // NOTE: This is a placeholder auth verifier used in development.
  // Return a role but no concrete id so we don't accidentally insert
  // a fake UUID into UUID FK columns. A real auth implementation should
  // return the actual user's UUID id.
  return { id: null as unknown as string, role: 'admin' };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      roleId,
      position,
      employmentType,
      salary,
      joinDate,
    } = body;

    // Check if employee exists
    const existingEmployee = await db
      .select({
        employee: employees,
        user: users,
        profile: userProfiles,
      })
      .from(employees)
      .innerJoin(users, eq(employees.userId, users.id))
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const { employee, user: existingUser, profile } = existingEmployee[0];

    // Check if email is being changed and if it already exists
    if (email !== existingUser.email) {
      const emailExists = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.id, existingUser.id)))
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Update employee and related records in transaction
    await db.transaction(async (tx) => {
      // Update user email if changed
      if (email !== existingUser.email) {
        await tx
          .update(users)
          .set({ email, updatedAt: new Date() })
          .where(eq(users.id, existingUser.id));
      }

      // Update user profile
      await tx
        .update(userProfiles)
        .set({
          firstName,
          lastName,
          phone: phone || null,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, existingUser.id));

      // Update employee record
      await tx
        .update(employees)
        .set({
          departmentId,
          position,
          employmentType,
          salary: salary ? parseInt(salary) : employee.salary,
          joinDate,
          updatedAt: new Date(),
        })
        .where(eq(employees.id, employeeId));

      // Update user role assignment: remove existing assignments and add new one if provided
      try {
        await tx.delete(userRoles).where(eq(userRoles.userId, existingUser.id));
      } catch (e) {
        // ignore if delete fails for any reason
      }

      if (roleId) {
        // Only set assignedBy when the authenticated user id is a valid UUID
        // and exists in the users table. This prevents FK constraint errors
        // when a dev/auth stub provides a non-existent placeholder id.
        const isUuid = (val: unknown) =>
          typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

        let assignedBy: string | null = null;
        const potentialId = (user as any)?.id;
        if (potentialId && isUuid(potentialId)) {
          // Check within the transaction whether this user actually exists
          const matching = await tx
            .select()
            .from(users)
            .where(eq(users.id, potentialId))
            .limit(1);
          if (matching.length > 0) {
            assignedBy = potentialId;
          }
        }

        await tx.insert(userRoles).values({
          userId: existingUser.id,
          roleId,
          assignedBy,
        });
      }
    });

    return NextResponse.json({
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Failed to update employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}


// app/api/admin/employees/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const { id: employeeId } = await params;

    // Check if employee exists
    const existingEmployee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (existingEmployee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Deactivate employee (soft delete)
    await db
      .update(employees)
      .set({
        isActive: false,
        status: 'inactive',
        updatedAt: new Date(),
      })
      .where(eq(employees.id, employeeId));

    // Also deactivate the user account
    const employee = existingEmployee[0];
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, employee.userId));

    return NextResponse.json({
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    console.error('Failed to deactivate employee:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate employee' },
      { status: 500 }
    );
  }
}