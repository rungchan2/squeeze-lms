import { NextRequest, NextResponse } from 'next/server';
import { 
  ApiGuardOptions, 
  ApiRouteHandler, 
  ProtectedApiRouteHandler,
  API_ERROR_CODES,
  ApiErrorCode
} from './types';
import { apiGuard, createApiErrorResponse } from './guards';


/**
 * Higher-order function to wrap API route handlers with security guards
 * 
 * @param handler - The API route handler function
 * @param options - Security configuration options
 * @returns Protected API route handler
 */
export function withApiGuard(
  handler: ApiRouteHandler,
  options: ApiGuardOptions = {}
): ApiRouteHandler {
  return async (request: NextRequest, context: { params?: Record<string, string> } | undefined = undefined) => {
    try {
      // Apply security guards
      const guardResult = await apiGuard(request, options);

      if (!guardResult.success) {
        // Map guard errors to appropriate HTTP status codes
        const statusCode = getStatusCodeForError(guardResult.code!);
        
        return createApiErrorResponse(
          guardResult.code as ApiErrorCode,
          guardResult.error!,
          statusCode,
          guardResult.rateLimitInfo ? { rateLimitInfo: guardResult.rateLimitInfo } : undefined
        );
      }

      // Add rate limit headers to successful requests
      const response = await handler(request, context);
      
      if (guardResult.rateLimitInfo) {
        response.headers.set('X-RateLimit-Remaining', guardResult.rateLimitInfo.remaining.toString());
        response.headers.set('X-RateLimit-Reset', guardResult.rateLimitInfo.resetTime.toString());
      }

      return response;

    } catch (error) {
      console.error('API Guard Error:', error);
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        'Internal server error',
        500,
        { details: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  };
}

/**
 * Higher-order function for protected routes that automatically injects user data
 * 
 * @param handler - The protected API route handler function (receives user data)
 * @param options - Security configuration options (requireAuth is automatically set to true)
 * @returns Protected API route handler
 */
export function withProtectedApiGuard(
  handler: ProtectedApiRouteHandler,
  options: Omit<ApiGuardOptions, 'requireAuth' | 'publicRoute'> = {}
): ApiRouteHandler {
  const guardOptions: ApiGuardOptions = {
    ...options,
    requireAuth: true,
    publicRoute: false,
  };

  return async (request: NextRequest, context: { params?: Record<string, string> } | undefined = undefined) => {
    try {
      // Apply security guards
      const guardResult = await apiGuard(request, guardOptions);

      if (!guardResult.success) {
        const statusCode = getStatusCodeForError(guardResult.code!);

        return createApiErrorResponse(
          guardResult.code as ApiErrorCode,
          guardResult.error!,
          statusCode,
          guardResult.rateLimitInfo ? { rateLimitInfo: guardResult.rateLimitInfo } : undefined
        );
      }

      // User data is guaranteed to exist for protected routes
      if (!guardResult.user) {
        return createApiErrorResponse(
          API_ERROR_CODES.SERVER_ERROR,
          'User data not available',
          500
        );
      }

      // Call handler with user data
      const response = await handler(request, {
        user: guardResult.user,
        params: context?.params,
      });

      // Add rate limit headers
      if (guardResult.rateLimitInfo) {
        response.headers.set('X-RateLimit-Remaining', guardResult.rateLimitInfo.remaining.toString());
        response.headers.set('X-RateLimit-Reset', guardResult.rateLimitInfo.resetTime.toString());
      }

      return response;

    } catch (error) {
      console.error('Protected API Guard Error:', error);
      return createApiErrorResponse(
        API_ERROR_CODES.SERVER_ERROR,
        'Internal server error',
        500,
        { details: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  };
}

/**
 * Map API error codes to HTTP status codes
 */
function getStatusCodeForError(code: string): number {
  switch (code) {
    case API_ERROR_CODES.UNAUTHORIZED:
      return 401;
    case API_ERROR_CODES.FORBIDDEN:
      return 403;
    case API_ERROR_CODES.INVALID_ORIGIN:
      return 403;
    case API_ERROR_CODES.RATE_LIMIT_EXCEEDED:
      return 429;
    case API_ERROR_CODES.METHOD_NOT_ALLOWED:
      return 405;
    case API_ERROR_CODES.INVALID_REQUEST:
    case API_ERROR_CODES.MISSING_PARAMETERS:
      return 400;
    case API_ERROR_CODES.SERVER_ERROR:
      return 500;
    default:
      return 400;
  }
}

/**
 * Convenience functions for common API guard patterns
 */
export const apiGuards = {
  /**
   * Public API route (no authentication required)
   */
  public: (handler: ApiRouteHandler) => 
    withApiGuard(handler, { publicRoute: true }),

  /**
   * Basic authenticated API route
   */
  authenticated: (handler: ProtectedApiRouteHandler) => 
    withProtectedApiGuard(handler),

  /**
   * Teacher-only API route
   */
  teacherOnly: (handler: ProtectedApiRouteHandler) => 
    withProtectedApiGuard(handler, { allowedRoles: ['teacher', 'admin'] }),

  /**
   * Admin-only API route
   */
  adminOnly: (handler: ProtectedApiRouteHandler) => 
    withProtectedApiGuard(handler, { allowedRoles: ['admin'] }),

  /**
   * GET-only API route
   */
  getOnly: (handler: ProtectedApiRouteHandler, requireAuth = true) => 
    requireAuth
      ? withProtectedApiGuard(handler, { allowedMethods: ['GET'] })
      : withApiGuard(handler as ApiRouteHandler, { allowedMethods: ['GET'], requireAuth: false }),

  /**
   * POST-only API route
   */
  postOnly: (handler: ProtectedApiRouteHandler) => 
    withProtectedApiGuard(handler, { allowedMethods: ['POST'] }),

  /**
   * Rate-limited API route
   */
  rateLimited: (handler: ProtectedApiRouteHandler, limit = 10) => 
    withProtectedApiGuard(handler, { rateLimit: limit }),

  /**
   * Multiple HTTP methods API route
   */
  methods: (methods: string[]) => (handler: ProtectedApiRouteHandler) =>
    withProtectedApiGuard(handler, { allowedMethods: methods }),
};