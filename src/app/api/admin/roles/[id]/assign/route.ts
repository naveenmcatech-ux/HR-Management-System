// app/api/admin/roles/[id]/assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { userRoles, users, roles, userProfiles, employees } from '@/lib/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const assignRoleSchema = z.object({
  userId: z.string().uuid(),
});

// POST /api/admin/roles/[id]/assign - Assign role to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = assignRoleSchema.parse(body);

    // Check if role exists
    const role = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (role.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, validatedData.userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if role is already assigned
    const existingAssignment = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, validatedData.userId),
          eq(userRoles.roleId, id)
        )
      )
      .limit(1);

    if (existingAssignment.length > 0) {
      return NextResponse.json(
        { error: 'Role already assigned to user' },
        { status: 400 }
      );
    }

    // Assign role
    await db.insert(userRoles).values({
      userId: validatedData.userId,
      roleId: id,
      assignedAt: new Date(),
    });

    // Update users count
    await db
      .update(roles)
      .set({
        usersCount: sql`COALESCE(${roles.usersCount}, 0) + 1`,
      })
      .where(eq(roles.id, id));

    return NextResponse.json({ message: 'Role assigned successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Failed to assign role:', error);
    return NextResponse.json(
      { error: 'Failed to assign role' },
      { status: 500 }
    );
  }
}

// GET /api/admin/roles/[id]/assign - List employees/users and whether they are assigned to the role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string } > }
) {
  try {
    const { id } = await params;
    
    // Get all users with their profile info (names, position) and employee dept
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        position: employees.position,
        departmentId: employees.departmentId,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(employees, eq(users.id, employees.userId))
      .where(eq(users.isActive, true));

    const assignments = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, id));

    const assignedSet = new Set(assignments.map((a: any) => a.userId));

    const result = usersList.map((u: any) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      position: u.position || 'N/A',
      assigned: assignedSet.has(u.id),
    }));

    return NextResponse.json({ success: true, users: result });
  } catch (error) {
    console.error('Failed to list users for role:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

// DELETE /api/admin/roles/[id]/assign - Unassign role from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId as string | undefined;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Check assignment exists
    const existing = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await db.delete(userRoles).where(
      and(eq(userRoles.userId, userId), eq(userRoles.roleId, id))
    );

    // Decrement usersCount safely (avoid negative)
    await db
      .update(roles)
      .set({ 
        usersCount: sql`GREATEST(COALESCE(${roles.usersCount}, 0) - 1, 0)` 
      })
      .where(eq(roles.id, id));

    return NextResponse.json({ message: 'Role unassigned successfully' });
  } catch (error) {
    console.error('Failed to unassign role:', error);
    return NextResponse.json({ error: 'Failed to unassign role' }, { status: 500 });
  }
}