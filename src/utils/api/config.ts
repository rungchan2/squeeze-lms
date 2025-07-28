import { ApiGuardOptions, UserRole } from './types';

/**
 * Route security profiles - predefined security configurations
 */
export const SECURITY_PROFILES = {
  /** Public routes that don't require any authentication */
  PUBLIC: {
    publicRoute: true,
  } as ApiGuardOptions,

  /** Standard authenticated user routes */
  USER: {
    requireAuth: true,
    allowedRoles: ['user', 'teacher', 'admin'] as UserRole[],
    rateLimit: 60,
  } as ApiGuardOptions,

  /** Teacher and admin only routes */
  TEACHER: {
    requireAuth: true,
    allowedRoles: ['teacher', 'admin'] as UserRole[],
    rateLimit: 60,
  } as ApiGuardOptions,

  /** Admin only routes */
  ADMIN: {
    requireAuth: true,
    allowedRoles: ['admin'] as UserRole[],
    rateLimit: 60,
  } as ApiGuardOptions,

  /** High-rate limit for data-intensive operations */
  DATA_INTENSIVE: {
    requireAuth: true,
    rateLimit: 100,
  } as ApiGuardOptions,

  /** Low-rate limit for resource-intensive operations */
  RESOURCE_INTENSIVE: {
    requireAuth: true,
    rateLimit: 10,
  } as ApiGuardOptions,

  /** Read-only operations */
  READ_ONLY: {
    requireAuth: true,
    allowedMethods: ['GET'],
    rateLimit: 100,
  } as ApiGuardOptions,

  /** Write operations */
  WRITE_ONLY: {
    requireAuth: true,
    allowedMethods: ['POST', 'PUT', 'PATCH'],
    rateLimit: 30,
  } as ApiGuardOptions,

  /** External API operations (like GitHub) */
  EXTERNAL_API: {
    requireAuth: true,
    rateLimit: 10,
    allowedMethods: ['POST'],
  } as ApiGuardOptions,
} as const;

/**
 * Route-specific security configurations
 * This centralizes all API security settings for easy management
 */
export const ROUTE_SECURITY_CONFIG: Record<string, ApiGuardOptions> = {
  // Authentication routes
  '/api/auth/rolecheck': SECURITY_PROFILES.PUBLIC,

  // User data routes
  '/api/user-points': {
    ...SECURITY_PROFILES.USER,
    allowedMethods: ['GET', 'POST'],
  },

  // Journey routes
  '/api/journey': SECURITY_PROFILES.READ_ONLY,
  '/api/journeys': SECURITY_PROFILES.READ_ONLY,
  '/api/journey-mission-instances': {
    ...SECURITY_PROFILES.USER,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  '/api/journey-weekly-stats': SECURITY_PROFILES.READ_ONLY,

  // Admin routes
  '/api/role-access-code': SECURITY_PROFILES.ADMIN,
  '/api/users/bulk-create': SECURITY_PROFILES.ADMIN,
  '/api/users/bulk-create-stream': SECURITY_PROFILES.ADMIN,

  // External integrations
  '/api/github/create-issue': {
    ...SECURITY_PROFILES.EXTERNAL_API,
    rateLimit: 5, // Very restrictive for GitHub API
  },

  // Subscription routes
  '/api/check-subscription': SECURITY_PROFILES.USER,
  '/api/save-subscription': {
    ...SECURITY_PROFILES.USER,
    allowedMethods: ['POST'],
  },

  // Open Graph and sitemap (can be public)
  '/api/og': SECURITY_PROFILES.PUBLIC,
  '/api/regenerate-sitemap': SECURITY_PROFILES.ADMIN,
};

/**
 * Get security configuration for a specific route
 */
export function getRouteSecurityConfig(routePath: string): ApiGuardOptions {
  // Check for exact match first
  if (ROUTE_SECURITY_CONFIG[routePath]) {
    return ROUTE_SECURITY_CONFIG[routePath];
  }

  // Check for pattern matches (for dynamic routes)
  for (const [configPath, config] of Object.entries(ROUTE_SECURITY_CONFIG)) {
    if (configPath.includes('[') && isRouteMatch(configPath, routePath)) {
      return config;
    }
  }

  // Default security profile for routes not explicitly configured
  return SECURITY_PROFILES.USER;
}

/**
 * Check if a dynamic route pattern matches the actual route
 */
function isRouteMatch(pattern: string, actualRoute: string): boolean {
  const patternParts = pattern.split('/');
  const routeParts = actualRoute.split('/');

  if (patternParts.length !== routeParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return true; // Dynamic segment matches anything
    }
    return part === routeParts[index];
  });
}

/**
 * Security configuration for development vs production
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    // More lenient rate limits in development
    rateMultiplier: 2,
    // Skip origin validation in development
    skipOriginValidation: true,
    // More detailed error messages
    verboseErrors: true,
  },
  production: {
    // Strict rate limits in production
    rateMultiplier: 1,
    // Enforce origin validation
    skipOriginValidation: false,
    // Generic error messages for security
    verboseErrors: false,
  },
} as const;

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENT_CONFIG[env as keyof typeof ENVIRONMENT_CONFIG] || ENVIRONMENT_CONFIG.development;
}

/**
 * Apply environment-specific modifications to security config
 */
export function applyEnvironmentConfig(config: ApiGuardOptions): ApiGuardOptions {
  const envConfig = getEnvironmentConfig();
  
  return {
    ...config,
    rateLimit: config.rateLimit ? Math.floor(config.rateLimit * envConfig.rateMultiplier) : undefined,
    skipOriginValidation: config.skipOriginValidation ?? envConfig.skipOriginValidation,
  };
}

/**
 * Utility to create custom security profiles
 */
export function createSecurityProfile(
  baseProfile: keyof typeof SECURITY_PROFILES,
  overrides: Partial<ApiGuardOptions> = {}
): ApiGuardOptions {
  return {
    ...SECURITY_PROFILES[baseProfile],
    ...overrides,
  };
}