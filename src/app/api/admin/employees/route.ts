// app/api/admin/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { employees, users, userProfiles, departments, userRoles, roles } from '@/lib/database/schema';
import { eq, sql, and, like, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Simple token verification
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  // For demo, accept any token - in production, verify properly
  return { id: '1', role: 'admin' };
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || (user.role !== 'admin' && user.role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';

    // Build where conditions
    const conditions: any[] = [eq(employees.isActive, true)];

    if (search) {
      conditions.push(
        or(
          like(userProfiles.firstName, `%${search}%`),
          like(userProfiles.lastName, `%${search}%`),
          like(users.email, `%${search}%`),
          employees.position ? like(employees.position, `%${search}%`) : sql`TRUE`
        )
      );
    }

    if (department) {
      conditions.push(like(departments.name, `%${department}%`));
    }

    if (status && status !== '') {
      conditions.push(eq(employees.status, status));
    }

    // Get employees with user, profile, and department info
    // Try the full select (includes employment_type). If the DB is not migrated yet
    // and the column doesn't exist, fall back to a reduced select to avoid a 500.
    let employeesData;
    try {
      employeesData = await db
        .select({
          id: employees.id,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          email: users.email,
          phone: userProfiles.phone,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          position: employees.position,
          employmentType: employees.employmentType,
          status: employees.status,
          joinDate: employees.joinDate,
          salary: employees.salary,
          isActive: employees.isActive,
          roleId: userRoles.roleId,
          roleName: roles.name,
          createdAt: employees.createdAt,
        })
        .from(employees)
        .innerJoin(users, eq(employees.userId, users.id))
        .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(userRoles, eq(userRoles.userId, users.id))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(...conditions))
        .orderBy(userProfiles.firstName, userProfiles.lastName);
    } catch (err: any) {
      // If the error indicates the employment_type column is missing, retry without it
      const msg = String(err?.message || err);
      if (msg.includes('employment_type') || msg.includes('employment.type') || msg.includes('column employees.employment_type does not exist')) {
        console.warn('employment_type column missing in DB; retrying query without that column');
        employeesData = await db
          .select({
            id: employees.id,
            firstName: userProfiles.firstName,
            lastName: userProfiles.lastName,
            email: users.email,
            phone: userProfiles.phone,
            departmentId: employees.departmentId,
            departmentName: departments.name,
            position: employees.position,
            status: employees.status,
            joinDate: employees.joinDate,
            salary: employees.salary,
            isActive: employees.isActive,
            roleId: userRoles.roleId,
            roleName: roles.name,
            createdAt: employees.createdAt,
          })
          .from(employees)
          .innerJoin(users, eq(employees.userId, users.id))
          .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
          .leftJoin(departments, eq(employees.departmentId, departments.id))
          .leftJoin(userRoles, eq(userRoles.userId, users.id))
          .leftJoin(roles, eq(userRoles.roleId, roles.id))
          .where(and(...conditions))
          .orderBy(userProfiles.firstName, userProfiles.lastName);
      } else {
        throw err;
      }
    }

    // Normalize rows to plain JSON-friendly objects (dates -> ISO strings, nulls -> defaults)
    const normalized = (employeesData || []).map((r: any) => ({
      id: r.id,
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      email: r.email || '',
      phone: r.phone || null,
      departmentId: r.departmentId || null,
      departmentName: r.departmentName || null,
      position: r.position || null,
      employmentType: r.employmentType || null,
      status: r.status || null,
      joinDate: r.joinDate ? (new Date(r.joinDate)).toISOString() : null,
      salary: typeof r.salary === 'number' ? r.salary : (r.salary ? Number(r.salary) : 0),
      isActive: !!r.isActive,
      roleId: r.roleId || null,
      roleName: r.roleName || null,
      createdAt: r.createdAt ? (new Date(r.createdAt)).toISOString() : null,
    }));

    return NextResponse.json({ 
      employees: normalized 
    });
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}


// app/api/admin/employees/route.ts
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      password,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !departmentId || !position || !joinDate || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Generate employee ID
    const employeeId = `EMP${Date.now().toString().slice(-6)}`;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction for creating user, profile, and employee
    const result = await db.transaction(async (tx) => {
      // Create user with hashed password
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role: 'employee',
          isActive: true,
        })
        .returning();

      // Create user profile
      const [profile] = await tx
        .insert(userProfiles)
        .values({
          userId: newUser.id,
          firstName,
          lastName,
          phone: phone || null,
        })
        .returning();

      // Create employee record
      const [employee] = await tx
        .insert(employees)
        .values({
          userId: newUser.id,
          departmentId,
          employeeId,
          position,
          employmentType: employmentType || 'full_time',
          salary: salary ? parseInt(salary) : 0,
          joinDate,
          status: 'active',
          isActive: true,
        })
        .returning();
      
      // Assign role to user if roleId provided
      if (roleId) {
        await tx
          .insert(userRoles)
          .values({
            userId: newUser.id,
            roleId,
            assignedBy: newUser.id,
          });
      }
      return { user: newUser, profile, employee };
    });

    return NextResponse.json(
      { 
        message: 'Employee created successfully',
        employee: {
          id: result.employee.id,
          firstName: result.profile.firstName,
          lastName: result.profile.lastName,
          email: result.user.email,
          employeeId: result.employee.employeeId,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}