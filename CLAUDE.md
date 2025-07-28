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
- **Centralized file management** with utilities in `src/utils/file/`

### Core Entities
- **Users**: Profiles with role-based permissions and organization affiliation
- **Organizations**: Multi-tenancy support for different institutions
- **Journeys**: Learning paths/courses with start/end dates
- **Journey Weeks**: Weekly structure within journeys
- **Missions**: Individual assignments with structured multi-question support
- **Mission Questions**: Individual questions within missions (essay, multiple_choice, image_upload, mixed)
- **Journey Mission Instances**: Missions assigned to specific journey weeks
- **Posts**: Student submissions with structured answers_data JSONB field
- **Files**: Centralized file management with metadata and soft deletion
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
- `src/utils/` - Utility functions (data/, supabase/, dayjs/, github/, file/)
- `src/types/` - Type definitions and Zod schemas
- `src/assets/` - Static assets (images, icons)

### Key File Management Files
- `src/utils/file/upload.ts` - File upload utilities with compression and progress
- `src/utils/file/helpers.ts` - File management helper functions
- `src/components/FileUpload.tsx` - Main file upload component
- `src/utils/file/index.ts` - File utility exports and sanitization

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
- **File uploads**: Use `FileUpload` component and file helper utilities
- **File references**: Prefer file IDs over URLs for new implementations

### PWA Configuration
- Service worker enabled in production
- Manifest configured for app installation
- Offline support for core functionality
- Push notifications configured

### File Management System

#### Architecture
- **Centralized file storage** using Supabase Storage with database tracking
- **Dual compatibility** for migration from URL-based to ID-based references
- **Metadata tracking** with file types, sizes, and custom JSON metadata
- **Soft deletion** with audit trails and recovery capabilities
- **Bucket organization** with configurable storage buckets

#### Core Components
- **Upload utility** (`src/utils/file/upload.ts`): Handles file uploads with compression and progress tracking
- **Helper functions** (`src/utils/file/helpers.ts`): Utilities for file operations (get URL, delete, etc.)
- **FileUpload component** (`src/components/FileUpload.tsx`): Drag-and-drop upload with progress and previews
- **File entity hooks**: SWR-based hooks for file management operations

#### Key Features
- **Immediate upload on drop** with real-time progress indicators
- **Multiple file support** with grid-based previews
- **Image compression** using browser-image-compression library
- **File type validation** and size limits
- **Automatic metadata extraction** (file size, MIME type, dimensions)
- **File name sanitization** for security and compatibility

#### Usage Patterns
- **Profile images**: Use `profile_image_file_id` alongside legacy `profile_image` URL
- **Journey images**: Use `image_file_id` alongside legacy `image_url`
- **Bug report attachments**: Use `attachment_file_id` alongside legacy `file_url`
- **Post attachments**: Future implementation will use file ID references

#### File System Migration Strategy
- **Backward compatibility**: Maintain both URL and file ID fields during transition
- **Gradual migration**: New uploads use file system, existing URLs remain functional
- **Helper functions**: Provide unified access regardless of storage method
- **Progressive enhancement**: File management features gradually replace direct URL usage

#### Helper Function Examples
```typescript
// Get file URL (works with both old URLs and new file IDs)
const imageUrl = await getProfileImageUrl(user)

// Get file information with metadata
const fileInfo = await getFileInfo(fileId)

// Delete file with soft deletion
await deleteFile(fileId, userId)
```

### Mission System Architecture

#### Modern Mission System (Post-Migration)
- **Multi-question structure**: Missions support multiple questions of different types
- **Question types**: essay, multiple_choice, image_upload, mixed
- **Database schema**: 
  - `missions` table with `mission_type` ENUM field
  - `mission_questions` table for individual questions with `multiple_select` support
  - `posts` table with `answers_data` JSONB field for structured answers
- **Legacy compatibility**: Automatic conversion from old text/image missions to new structure
- **Migration status**: 575 posts migrated, 71 missions converted to structured format

#### Mission Creation
- **Dual-mode interface**: Simple mode vs advanced question builder
- **Question Builder**: Dynamic question management with drag-and-drop reordering
- **Type-specific settings**: Each question type has customizable parameters
- **Form validation**: React Hook Form + Zod integration
- **Auto-save**: Real-time progress saving during creation

#### Mission Execution
- **Modern interface**: Question-by-question progression with progress indicators
- **Type-specific inputs**: 
  - `EssayQuestionInput`: Rich text editor with character limits
  - `MultipleChoiceInput`: Radio/checkbox selection with validation
  - `ImageUploadInput`: Drag-and-drop with multiple image support
  - `MixedQuestionInput`: Combined text and image input
- **Structured answers**: JSON-based answer storage in `answers_data` field
- **Auto-save**: Automatic answer saving with localStorage backup

#### Mission Display
- **Enhanced PostCard**: Structured answer display with question breakdown
- **Type indicators**: Mission type icons and labels
- **Rich media support**: Image gallery display for image-based answers
- **Scoring system**: Support for both auto-scoring (multiple choice) and manual scoring

### Important Cursor Rules
- **Auth flow**: User profiles stored in `profiles` table with Supabase Storage for images
- **Session management**: Use Supabase client for session handling with automatic redirection
- **Profile images**: Use `ProfileImage` component for consistent display
- **File uploads**: Always use the centralized file management system via `FileUpload` component  
- **File storage**: Store file references as IDs in database, use helper functions to get URLs
- **Migration compatibility**: Support both legacy URL fields and new file ID fields during transition
- **Mission development**: Always support both legacy and modern mission formats
- **Question management**: Use `useMissionQuestions` hook for question CRUD operations
- **Structured answers**: Store answers in JSONB format with proper type validation
```

### Recent Schema and Mission System Updates
- Updated mission schema to support more granular tracking of mission progress
- Enhanced mission type definitions to accommodate more complex learning scenarios
- Improved mission instance tracking with additional metadata fields
- Implemented more robust validation for mission creation and assignment
- Added support for dynamic mission point calculations based on mission complexity

### Migration Specifications
- **Database Migration File**: Updated specs for database migration strategies
- **Key Migration Points**:
  - Implement phased migration approach for database schema updates
  - Ensure backward compatibility during migration process
  - Use database migration scripts for systematic schema transitions
  - Add validation checks for data integrity during migration
  - Support rollback mechanisms for migration failures

### Mission Questions Table Updates
- Reviewed `@specs/database-migration.md` for `mission_questions` table migration specifications
- Updated `mission_questions` table schema to support more detailed and flexible question tracking
- Added support for different question types and response formats
- Implemented enhanced metadata storage for mission-related questions
- Improved data integrity and validation for mission question entries