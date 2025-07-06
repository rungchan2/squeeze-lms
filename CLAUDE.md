# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run dev-turbo` - Alternative development command with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database
- `npm run update-type` - Generate TypeScript types from Supabase schema
- Runs: `supabase gen types typescript --linked --debug > src/types/database.types.ts`

### Environment-specific
- `npm run dev-new` - Development with alternative environment file (`.env.new`)

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: Chakra UI v3 with Emotion for styling
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Supabase Auth with JWT tokens
- **State Management**: Zustand for global state, SWR for server state
- **Rich Text**: Tiptap editor with extensions
- **PWA**: Next-PWA for progressive web app features
- **Analytics**: Vercel Analytics, PostHog, Google Analytics

### Authentication System
- **Supabase Auth** with email/password and social logins (Google OAuth)
- **Role-based access control**: user(1) → teacher(2) → admin(3) hierarchy
- **JWT token decoding** for user metadata in `useSupabaseAuth.ts`
- **Session management** via middleware and cookies
- **Route protection** using `RoleGuard` components
- **Multi-tenant organization system** with organization-based data isolation
- **Access code system** for teacher/admin role assignment

#### User Creation Flow
1. **Signup Process**: 
   - Email/password signup via `signUpWithEmail()` in `src/app/(auth)/actions.ts`
   - Social login (Google) via `socialLogin()` in `src/utils/data/auth.ts`
   - Profile completion required for social login users

2. **Profile Creation**:
   - User profiles stored in `profiles` table
   - Required fields: email, first_name, last_name, phone, organization_id
   - Optional: profile_image, marketing_opt_in, privacy_agreed
   - Created via `createProfile()` in `src/utils/data/user.ts`

3. **Role Assignment**:
   - Default role: "user" (students)
   - Teacher/admin roles require access codes from `role_access_code` table
   - Access codes validated during signup process
   - Role hierarchy: user(1) < teacher(2) < admin(3)

4. **Organization Assignment**:
   - Users must select organization during signup
   - Organizations filtered to exclude internal "스퀴즈" organizations
   - Multi-tenant data isolation based on organization_id

5. **Social Login Flow**:
   - OAuth callback handled in `src/app/(auth)/auth/callback/route.ts`
   - New users redirected to `/login/info` for profile completion
   - User data encrypted and stored in cookies temporarily
   - Profile creation after information completion

#### Authentication State Management
- **Zustand store** in `useSupabaseAuth.ts` with real-time updates
- **JWT token decoding** for user metadata and app metadata
- **Role checking** via `useRole()` and `useRoleCheck()` hooks
- **Session refresh** with automatic token renewal
- **Profile image management** via Supabase Storage

#### Security Features
- **AES-256-CBC encryption** for temporary data storage
- **Server-side role verification** via `/api/auth/rolecheck`
- **Session validation** on each request through middleware
- **Access code system** for role elevation
- **Organization-based data isolation**

### Data Layer Architecture
- **Repository pattern** with service functions in `src/utils/data/`
- **SWR hooks** for data fetching with caching (pattern: `useEntity.ts`)
- **Zod schemas** for type safety and validation in `src/types/`
- **Generated database types** from Supabase schema

### Core Entities
- **Users**: Profiles with role-based permissions and organization affiliation
- **Organizations**: Multi-tenancy support for different institutions
- **Journeys**: Learning paths/courses with start/end dates
- **Journey Weeks**: Weekly structure within journeys
- **Missions**: Individual assignments with points and types
- **Journey Mission Instances**: Missions assigned to specific journey weeks
- **Posts**: Student submissions for missions with scoring and team support
- **Supporting entities**: Comments, Likes, Notifications, Teams, User Points

### Route Structure (App Router)
- `(auth)` - Authentication pages with shared layout
- `(admin)` - Admin-only pages with role guards
- `(home)` - Main dashboard with tabbed interface (class, notifications, profile)
- `(common)` - Shared pages (profile, bug reports)
- `journey/[slug]/[id]` - Journey detail pages with nested tabs (feed, mission, plan, dashboard, setting)
- `journey/[slug]/teacher/` - Teacher-specific journey management
- `post/[id]` - Post detail and editing pages
- `mission/` - Mission creation and editing

### Key Patterns
- **Custom hooks**: SWR-based hooks for each entity with CRUD operations
- **Compound components**: Complex UI components with multiple parts
- **Provider pattern**: Global providers for auth, UI, and data fetching
- **Type safety**: Runtime validation with Zod schemas
- **Path aliases**: `@/*` maps to `src/*`

### File Organization
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable UI components (common/, ui/, auth/)
- `src/hooks/` - Custom hooks for data fetching and state management
- `src/utils/` - Utility functions (data/, supabase/, dayjs/, github/)
- `src/types/` - Type definitions and Zod schemas
- `src/assets/` - Static assets (images, icons)

### Important Files
- `middleware.ts` - Request-level authentication handling
- `src/app/providers.tsx` - Global providers configuration
- `src/utils/supabase/client.ts` - Browser Supabase client
- `src/utils/supabase/server.ts` - Server Supabase client with cookies
- `src/hooks/useSupabaseAuth.ts` - Global authentication state

### Development Guidelines
- **Authentication**: Use `useSupabaseAuth` hook for auth state
- **Data fetching**: Use existing SWR hooks (e.g., `useJourney`, `useMission`)
- **Role checking**: Use `RoleGuard` components and `useRoleCheck` hook
- **Type safety**: Always use Zod schemas for validation
- **Styling**: Use Chakra UI components and Emotion for custom styles
- **Real-time**: Leverage Supabase real-time subscriptions where needed

### PWA Configuration
- Service worker enabled in production
- Manifest configured for app installation
- Offline support for core functionality
- Push notifications configured

### Important Cursor Rules
- **Auth flow**: User profiles stored in `profiles` table with Supabase Storage for images
- **Session management**: Use Supabase client for session handling with automatic redirection
- **Profile images**: Use `ProfileImage` component for consistent display