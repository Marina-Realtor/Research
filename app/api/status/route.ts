import { NextResponse } from 'next/server';
import { getLastRunTimestamps } from '@/lib/urgentTracker';
import { getQueryCounts, BLOG_URL } from '@/lib/queries';
import { StatusData } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const timestamps = await getLastRunTimestamps();
    const counts = getQueryCounts();

    // Determine system status based on last run times
    let status: StatusData['status'] = 'operational';

    if (timestamps.lastMorningRun) {
      const lastRun = new Date(timestamps.lastMorningRun);
      const hoursSinceRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
      if (hoursSinceRun > 36) {
        status = 'error';
      } else if (hoursSinceRun > 26) {
        status = 'degraded';
      }
    } else {
      // No runs yet
      status = 'degraded';
    }

    const data: StatusData = {
      status,
      lastMorningRun: timestamps.lastMorningRun,
      lastEveningRun: timestamps.lastEveningRun,
      morningQueryCount: counts.morning,
      eveningQueryCount: counts.evening,
      blogUrl: BLOG_URL,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
