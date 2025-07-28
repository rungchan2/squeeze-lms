import { NextRequest, NextResponse } from 'next/server';

/**
 * User role types from the existing authentication system
 */
export type UserRole = 'user' | 'teacher' | 'admin';

/**
 * API Security configuration options
 */
export interface ApiGuardOptions {
  /** Whether authentication is required */
  requireAuth?: boolean;
  
  /** Allowed user roles (hierarchical - higher roles include lower permissions) */
  allowedRoles?: UserRole[];
  
  /** Allowed HTTP methods */
  allowedMethods?: string[];
  
  /** Rate limit - requests per minute */
  rateLimit?: number;
  
  /** Whether this is a public route (bypasses all security checks) */
  publicRoute?: boolean;
  
  /** Custom origin validation */
  customOriginValidation?: (request: NextRequest) => boolean;
  
  /** Skip origin validation (use with caution) */
  skipOriginValidation?: boolean;
}

/**
 * API Guard response type
 */
export interface ApiGuardResponse {
  success: boolean;
  error?: string;
  code?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
  };
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
}

/**
 * API Route handler type
 */
export type ApiRouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

/**
 * Protected API Route handler type (includes user info)
 */
export type ProtectedApiRouteHandler = (
  request: NextRequest,
  context: any
) => Promise<NextResponse>;

/**
 * API error codes
 */
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_ORIGIN: 'INVALID_ORIGIN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  SERVER_ERROR: 'SERVER_ERROR',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_CODES;