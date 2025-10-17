import { NextResponse } from 'next/server';
import { db } from '@/lib/db/vertica';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test 1: Health check
    const healthy = await db.healthCheck();

    // Test 2: Simple query
    const testQuery = await db.query('SELECT NOW() as current_time');

    // Test 3: Check if config table has data
    const configCount = await db.query(`
      SELECT COUNT(*) as count
      FROM trc.publisher_config
      WHERE attribute = 'spending-burst-protection:is-enabled-for-publisher'
    `);

    // Test 4: Get sample data
    const sampleData = await db.query(`
      SELECT publisher_id, date(update_time) as feature_date
      FROM trc.publisher_config
      WHERE attribute = 'spending-burst-protection:is-enabled-for-publisher'
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      tests: {
        healthCheck: healthy,
        currentTime: testQuery[0],
        configCount: configCount[0],
        sampleData,
      },
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}
