import { NextResponse } from 'next/server';
import { z } from 'zod';

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
  success: false;
}

export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Invalid request parameters',
        details: error.issues,
        success: false,
      },
      { status: 400 }
    );
  }

  if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
    return NextResponse.json(
      {
        error: 'Database connection failed',
        message: 'Unable to connect to Vertica database',
        success: false,
      },
      { status: 503 }
    );
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message);
    if (errorMessage.includes('timeout') || errorMessage.includes('acquire')) {
      return NextResponse.json(
        {
          error: 'Connection pool timeout',
          message: 'All database connections are busy. Please try again in a moment.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          success: false,
        },
        { status: 503 }
      );
    }
  }

  return NextResponse.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development'
        ? (error as Error).message
        : undefined,
      success: false,
    },
    { status: 500 }
  );
}
