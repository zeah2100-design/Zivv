import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { music, users } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = db
      .select({
        id: music.id,
        title: music.title,
        artist: music.artist,
        audioUrl: music.audioUrl,
        coverUrl: music.coverUrl,
        duration: music.duration,
        plays: music.plays,
        createdAt: music.createdAt,
        userId: music.userId,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(music)
      .innerJoin(users, eq(music.userId, users.id))
      .orderBy(desc(music.createdAt));

    if (userId) {
      const tracks = await db
        .select({
          id: music.id,
          title: music.title,
          artist: music.artist,
          audioUrl: music.audioUrl,
          coverUrl: music.coverUrl,
          duration: music.duration,
          plays: music.plays,
          createdAt: music.createdAt,
          userId: music.userId,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(music)
        .innerJoin(users, eq(music.userId, users.id))
        .where(eq(music.userId, parseInt(userId)))
        .orderBy(desc(music.createdAt));
      return NextResponse.json({ music: tracks });
    }

    const allMusic = await query;
    return NextResponse.json({ music: allMusic });
  } catch (error) {
    console.error('Error fetching music:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, artist, audioUrl, coverUrl, duration } = body;

    if (!userId || !title || !audioUrl) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    const [newTrack] = await db.insert(music).values({
      userId,
      title,
      artist,
      audioUrl,
      coverUrl,
      duration,
    }).returning();

    return NextResponse.json({ success: true, track: newTrack });
  } catch (error) {
    console.error('Error creating music:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
