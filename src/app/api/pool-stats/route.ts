import { NextResponse } from 'next/server';
import { getPoolStats, db } from '@/lib/db/vertica';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getPoolStats();
    const isHealthy = await db.healthCheck();

    return NextResponse.json({
      success: true,
      pool: stats,
      healthy: isHealthy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Pool stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get pool stats',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        success: false,
      },
      { status: 500 }
    );
  }
}
