import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from '@/hooks/useSupabaseAuth';
import { 
  ApiGuardOptions, 
  ApiGuardResponse, 
  UserRole,
  API_ERROR_CODES,
  ApiErrorCode 
} from './types';
import { 
  validateOrigin, 
  checkRateLimit, 
  getClientIP, 
  SECURITY_HEADERS 
} from './security';

/**
 * Role hierarchy for permission checking
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  teacher: 2,
  admin: 3,
};

/**
 * Create standardized API error response
 */
export function createApiErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number = 400,
  additionalData?: Record<string, any>
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: message,
      code,
      ...additionalData,
    },
    { status }
  );

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Create standardized API success response
 */
export function createApiSuccessResponse(
  data: any,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const response = NextResponse.json({
    success: true,
    ...data,
  });

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add additional headers if provided
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

/**
 * Validate HTTP method against allowed methods
 */
function validateMethod(request: NextRequest, allowedMethods?: string[]): boolean {
  if (!allowedMethods || allowedMethods.length === 0) {
    return true;
  }
  
  return allowedMethods.includes(request.method);
}

/**
 * Validate user role against required roles
 */
function validateRole(userRole: UserRole, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
  
  // Check if user has any of the allowed roles (hierarchical)
  return allowedRoles.some(role => {
    const requiredLevel = ROLE_HIERARCHY[role] || 999;
    return userRoleLevel >= requiredLevel;
  });
}

/**
 * Get authenticated user from Supabase session
 */
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return null;
    }

    // Decode JWT token to get user metadata
    const decodedToken = jwtDecode<DecodedToken>(session.access_token);
    const { role } = decodedToken.app_metadata || {};

    if (!role) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: role as UserRole,
      firstName: session.user.user_metadata?.first_name,
      lastName: session.user.user_metadata?.last_name,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Main API guard function
 */
export async function apiGuard(
  request: NextRequest,
  options: ApiGuardOptions = {}
): Promise<ApiGuardResponse> {
  const {
    requireAuth = true,
    allowedRoles,
    allowedMethods,
    rateLimit = 60,
    publicRoute = false,
    customOriginValidation,
    skipOriginValidation = false,
  } = options;

  // Skip all checks for public routes
  if (publicRoute) {
    return { success: true };
  }

  // 1. Validate HTTP method
  if (!validateMethod(request, allowedMethods)) {
    return {
      success: false,
      error: `Method ${request.method} not allowed`,
      code: API_ERROR_CODES.METHOD_NOT_ALLOWED,
    };
  }

  // 2. Validate origin
  if (!skipOriginValidation) {
    const isValidOrigin = customOriginValidation 
      ? customOriginValidation(request)
      : validateOrigin(request);

    if (!isValidOrigin) {
      return {
        success: false,
        error: 'Request from unauthorized origin',
        code: API_ERROR_CODES.INVALID_ORIGIN,
      };
    }
  }

  // 3. Rate limiting
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`api:${clientIP}`, rateLimit);
  
  if (!rateLimitResult.allowed) {
    return {
      success: false,
      error: 'Rate limit exceeded',
      code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
    };
  }

  // 4. Authentication check
  if (requireAuth) {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      return {
        success: false,
        error: '인증되지 않은 사용자입니다',
        code: API_ERROR_CODES.UNAUTHORIZED,
      };
    }

    // 5. Role validation
    if (!validateRole(user.role, allowedRoles)) {
      return {
        success: false,
        error: '접근 권한이 없습니다',
        code: API_ERROR_CODES.FORBIDDEN,
      };
    }

    return {
      success: true,
      user,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      },
    };
  }

  // Return success for non-authenticated routes
  return {
    success: true,
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
    },
  };
}

/**
 * Convenience function for common guard scenarios
 */
export const guardPresets = {
  /** Public route - no security checks */
  public: (): ApiGuardOptions => ({
    publicRoute: true,
  }),

  /** Basic authenticated route */
  authenticated: (): ApiGuardOptions => ({
    requireAuth: true,
  }),

  /** Teacher or admin only */
  teacherOnly: (): ApiGuardOptions => ({
    requireAuth: true,
    allowedRoles: ['teacher', 'admin'],
  }),

  /** Admin only */
  adminOnly: (): ApiGuardOptions => ({
    requireAuth: true,
    allowedRoles: ['admin'],
  }),

  /** GET requests only */
  getOnly: (requireAuth = true): ApiGuardOptions => ({
    requireAuth,
    allowedMethods: ['GET'],
  }),

  /** POST requests only */
  postOnly: (requireAuth = true): ApiGuardOptions => ({
    requireAuth,
    allowedMethods: ['POST'],
  }),

  /** High rate limit for intensive operations */
  rateLimited: (limit = 10): ApiGuardOptions => ({
    requireAuth: true,
    rateLimit: limit,
  }),
};