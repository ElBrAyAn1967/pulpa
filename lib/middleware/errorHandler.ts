/**
 * API Error Handler Middleware
 *
 * Provides consistent error handling and responses across all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { PulpaError, ErrorCode, toPulpaError } from '@/lib/errors/types';
import { logger, LogCategory } from '@/lib/logging/logger';
import { monitoring } from '@/lib/monitoring/alerts';

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    userMessage: string;
    timestamp: string;
  };
  context?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

/**
 * Handle API errors with consistent formatting and logging
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const pulpaError = toPulpaError(error, context);

  // Log the error
  logger.error(
    LogCategory.API,
    `API Error: ${pulpaError.message}`,
    pulpaError,
    context
  );

  // Track error for monitoring
  monitoring.trackError(pulpaError.code);

  // Send alerts for critical errors
  if (pulpaError.code === ErrorCode.INSUFFICIENT_BALANCE) {
    monitoring.alertLowBalance(
      context?.currentBalance as string || 'unknown',
      context?.minterAddress as string || 'unknown'
    );
  }

  if (pulpaError.code === ErrorCode.TRANSACTION_FAILED) {
    monitoring.alertFailedTransaction(
      context?.transactionHash as string || 'unknown',
      pulpaError.message,
      context || {}
    );
  }

  if (pulpaError.code === ErrorCode.DATABASE_CONNECTION_FAILED ||
      pulpaError.code === ErrorCode.DATABASE_QUERY_FAILED) {
    monitoring.alertDatabaseError(pulpaError.message);
  }

  // Determine HTTP status code
  const statusCode = getHttpStatusCode(pulpaError.code);

  // Create response
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: pulpaError.code,
      message: process.env.NODE_ENV === 'development' ? pulpaError.message : pulpaError.userMessage,
      userMessage: pulpaError.userMessage,
      timestamp: pulpaError.timestamp,
    },
  };

  // Include context in development
  if (process.env.NODE_ENV === 'development' && Object.keys(pulpaError.context).length > 0) {
    response.context = pulpaError.context;
  }

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create success response with consistent formatting
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Map error codes to HTTP status codes
 */
function getHttpStatusCode(errorCode: ErrorCode): number {
  switch (errorCode) {
    // 400 Bad Request
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.INVALID_ADDRESS:
    case ErrorCode.INVALID_CONFIGURATION:
      return 400;

    // 401 Unauthorized
    case ErrorCode.UNAUTHORIZED:
      return 401;

    // 403 Forbidden
    case ErrorCode.BLACKLISTED_ADDRESS:
    case ErrorCode.MINTER_ROLE_MISSING:
      return 403;

    // 404 Not Found
    case ErrorCode.RECORD_NOT_FOUND:
    case ErrorCode.NFC_NOT_REGISTERED:
      return 404;

    // 409 Conflict
    case ErrorCode.DUPLICATE_RECORD:
    case ErrorCode.RECIPIENT_ALREADY_RECEIVED:
      return 409;

    // 429 Too Many Requests
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;

    // 500 Internal Server Error
    case ErrorCode.DATABASE_CONNECTION_FAILED:
    case ErrorCode.DATABASE_QUERY_FAILED:
    case ErrorCode.MISSING_ENV_VARIABLE:
      return 500;

    // 502 Bad Gateway (external service issues)
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.CONTRACT_ERROR:
      return 502;

    // 503 Service Unavailable
    case ErrorCode.INSUFFICIENT_BALANCE:
    case ErrorCode.GAS_ESTIMATION_FAILED:
    case ErrorCode.TRANSACTION_FAILED:
      return 503;

    // 500 Default
    default:
      return 500;
  }
}

/**
 * Async wrapper for API routes with error handling
 */
export function withErrorHandling<T>(
  handler: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse<T>>
) {
  return async (req: NextRequest, context?: Record<string, unknown>): Promise<NextResponse> => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;

    try {
      logger.info(LogCategory.API, `${method} ${endpoint} - Request started`, {
        method,
        endpoint,
      });

      const response = await handler(req, context);

      const duration = Date.now() - startTime;
      const statusCode = response.status;

      logger.logApiRequest(method, endpoint, statusCode, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        LogCategory.API,
        `${method} ${endpoint} - Request failed`,
        error instanceof Error ? error : undefined,
        { method, endpoint, duration }
      );

      return handleApiError(error, {
        method,
        endpoint,
        duration,
        ...context,
      });
    }
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): void {
  for (const field of requiredFields) {
    if (!body[field]) {
      const error = new Error(`Missing required field: ${field}`);
      error.name = 'ValidationError';
      throw error;
    }
  }
}

/**
 * Parse and validate JSON request body
 */
export async function parseJsonBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}
