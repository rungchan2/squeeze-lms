/**
 * API Security System
 * 
 * Comprehensive security middleware for Next.js API routes
 * Provides authentication, authorization, rate limiting, and origin validation
 */

// Core types and interfaces
export type {
  UserRole,
  ApiGuardOptions,
  ApiGuardResponse,
  ApiRouteHandler,
  ProtectedApiRouteHandler,
  ApiErrorCode,
} from './types';

export { API_ERROR_CODES } from './types';

// Security utilities
export {
  validateOrigin,
  checkRateLimit,
  getClientIP,
  SECURITY_HEADERS,
  cleanupRateLimit,
} from './security';

// Core guard functions
export {
  apiGuard,
  createApiErrorResponse,
  createApiSuccessResponse,
  guardPresets,
} from './guards';

// Higher-order function wrappers
export {
  withApiGuard,
  withProtectedApiGuard,
  apiGuards,
} from './withApiGuard';

// Configuration and profiles
export {
  SECURITY_PROFILES,
  ROUTE_SECURITY_CONFIG,
  ENVIRONMENT_CONFIG,
  getRouteSecurityConfig,
  getEnvironmentConfig,
  applyEnvironmentConfig,
  createSecurityProfile,
} from './config';

/**
 * Quick start examples:
 * 
 * 1. Basic authenticated route:
 *    export const GET = apiGuards.authenticated(async (request, { user }) => {
 *      // user is automatically available and typed
 *      return createApiSuccessResponse({ data: user });
 *    });
 * 
 * 2. Admin-only route:
 *    export const POST = apiGuards.adminOnly(async (request, { user }) => {
 *      // Only admin users can access this
 *      return createApiSuccessResponse({ message: 'Admin access granted' });
 *    });
 * 
 * 3. Public route:
 *    export const GET = apiGuards.public(async (request) => {
 *      return createApiSuccessResponse({ message: 'Public data' });
 *    });
 * 
 * 4. Custom security configuration:
 *    export const POST = withProtectedApiGuard(async (request, { user }) => {
 *      return createApiSuccessResponse({ data: 'custom protected data' });
 *    }, {
 *      allowedRoles: ['teacher', 'admin'],
 *      rateLimit: 10,
 *      allowedMethods: ['POST']
 *    });
 */