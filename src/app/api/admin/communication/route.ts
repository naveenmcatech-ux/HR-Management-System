// app/api/admin/communication/route.ts
import { db } from '@/lib/database/db';
import { announcements, users, userProfiles } from '@/lib/database/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
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

    const announcementsList = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        message: announcements.message,
        type: announcements.type,
        target: announcements.target,
        targetValue: announcements.targetValue,
        scheduledFor: announcements.scheduledFor,
        status: announcements.status,
        createdAt: announcements.createdAt,
        createdBy: sql<string>`CONCAT(${userProfiles.firstName}, ' ', ${userProfiles.lastName})`,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .orderBy(desc(announcements.createdAt));

    return NextResponse.json({
      success: true,
      announcements: announcementsList,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const {
      title,
      message,
      type = 'general',
      target = 'all',
      targetValue,
      scheduledFor,
      status = 'draft',
    } = await request.json();

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    const newAnnouncement = await db
      .insert(announcements)
      .values({
        title,
        message,
        type,
        target,
        targetValue,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status,
        createdBy: decoded.userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Announcement created successfully',
      announcement: newAnnouncement[0],
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}