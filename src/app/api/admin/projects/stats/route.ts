// app/api/admin/projects/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { projects } from '@/lib/database/schema';
import { eq, count, sum, and, sql } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/utils';

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

    // Get total projects
    const totalProjectsResult = await db
      .select({ count: count() })
      .from(projects);

    // Get active projects
    const activeProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, 'active'));

    // Get completed projects
    const completedProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, 'completed'));

    // Get delayed projects (end date passed but not completed)
    const delayedProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(
        and(
          eq(projects.status, 'active'),
          sql`${projects.endDate} < NOW()`
        )
      );

    // Get total budget
    const totalBudgetResult = await db
      .select({ total: sum(projects.budget) })
      .from(projects);

    const stats = {
      totalProjects: totalProjectsResult[0]?.count || 0,
      activeProjects: activeProjectsResult[0]?.count || 0,
      completedProjects: completedProjectsResult[0]?.count || 0,
      delayedProjects: delayedProjectsResult[0]?.count || 0,
      totalBudget: totalBudgetResult[0]?.total || 0,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Project stats GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}