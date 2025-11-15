// app/api/admin/security/route.ts
import { db } from '@/lib/database/db';
import { securityLogs, users, userProfiles } from '@/lib/database/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
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

    const securityLogsList = await db
      .select({
        id: securityLogs.id,
        timestamp: securityLogs.timestamp,
        user: sql<string>`CONCAT(${userProfiles.firstName}, ' ', ${userProfiles.lastName})`,
        action: securityLogs.action,
        ipAddress: securityLogs.ipAddress,
        status: securityLogs.status,
        details: securityLogs.details,
      })
      .from(securityLogs)
      .leftJoin(users, eq(securityLogs.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(desc(securityLogs.timestamp))
      .limit(100); // Limit to recent 100 logs

    return NextResponse.json({
      success: true,
      securityLogs: securityLogsList,
    });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}