# Sqeeze LMS Database Schema

This document provides a comprehensive overview of the Sqeeze LMS database schema, including all tables, relationships, and data types. This schema supports a learning management system with role-based access control, journey-based learning paths, mission assignments, and team collaboration features.

## Project Information
- **Database Type**: PostgreSQL (Supabase)
- **Project ID**: egptutozdfchliouephl
- **Region**: ap-northeast-2
- **Postgres Version**: 15.8.1.070

## Core Entities Overview

### Authentication & User Management
- **Organizations**: Multi-tenant organization structure
- **Profiles**: User profiles with role-based permissions
- **Role Access Code**: Access codes for role elevation

### Learning Structure
- **Journeys**: Learning paths/courses
- **Journey Weeks**: Weekly structure within journeys
- **Missions**: Individual assignments/tasks
- **Journey Mission Instances**: Missions assigned to specific journey weeks
- **User Journeys**: User enrollment in journeys

### Content & Engagement
- **Posts**: Student submissions and content
- **Comments**: Post comments
- **Likes**: Post likes/reactions
- **Notifications**: User notifications

### Team Management
- **Teams**: Team structure within journeys
- **Team Members**: Team membership

### Points & Scoring
- **User Points**: Individual user points
- **Team Points**: Team-based points

### System Features
- **Files**: Centralized file management system
- **Bug Reports**: User-submitted bug reports
- **Email Queue**: Email notification queue
- **Subscriptions**: Push notification subscriptions
- **Blog**: Blog content management
- **Inquiry**: Business inquiry form data

---

## Detailed Table Schemas

### 1. Organizations

Multi-tenant organization structure for institutional data isolation.

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc')
);
```

**Key Features:**
- RLS Enabled: ✅
- Primary Key: `id` (UUID)
- Estimated Records: 18

---

### 2. Profiles

User profiles with role-based permissions and organization affiliation.

```sql
CREATE TYPE role AS ENUM ('user', 'teacher', 'admin');

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    first_name TEXT,
    last_name TEXT,
    organization_id UUID DEFAULT '6fb0bbe1-56ac-40fc-8725-ae302d6faac0'::uuid,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    profile_image TEXT,
    profile_image_file_id BIGINT,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
    privacy_agreed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    role role NOT NULL DEFAULT 'user',
    push_subscription TEXT,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (id) REFERENCES auth.users(id),
    FOREIGN KEY (profile_image_file_id) REFERENCES files(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Primary Key: `id` (UUID, linked to auth.users)
- Role Hierarchy: user(1) → teacher(2) → admin(3)
- Organization-based data isolation
- Profile image storage via Supabase Storage and centralized file system
- Dual support for legacy `profile_image` URL and new `profile_image_file_id`
- Estimated Records: 349

**Role Enum Values:**
- `user`: Students (default)
- `teacher`: Teachers/instructors
- `admin`: System administrators

---

### 3. Role Access Code

Access codes for teacher/admin role assignment during signup.

```sql
CREATE TABLE role_access_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role role NOT NULL,
    code UUID DEFAULT gen_random_uuid(),
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Features:**
- RLS Enabled: ✅
- Used for role elevation during user registration
- Supports expiry dates for time-limited access
- Estimated Records: 1

---

### 4. Journeys

Learning paths/courses with start and end dates.

```sql
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date_start DATE,
    date_end DATE,
    image_url TEXT,
    image_file_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (image_file_id) REFERENCES files(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Course/learning path management
- Optional date ranges for course scheduling
- Image support for course branding via centralized file system
- Dual support for legacy `image_url` and new `image_file_id`
- Estimated Records: 16

---

### 5. User Journeys

User enrollment and participation in journeys.

```sql
CREATE TABLE user_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    journey_id UUID NOT NULL,
    role_in_journey TEXT DEFAULT 'user',
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (user_id) REFERENCES profiles(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);
```

**Key Features:**
- RLS Enabled: ❌
- Junction table for user-journey relationships
- Supports different roles within journeys
- Tracks enrollment date
- Estimated Records: 349

---

### 6. Journey Weeks

Weekly structure within journeys for organized learning progression.

```sql
CREATE TABLE journey_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL,
    name TEXT NOT NULL,
    week_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Organizes journey content by weeks
- Sequential week numbering
- Estimated Records: 49

---

### 7. Missions

Individual assignments/tasks with points and types.

```sql
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mission_type TEXT,
    points INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Features:**
- RLS Enabled: ✅
- Reusable mission templates
- Point-based scoring system
- Flexible mission types
- Estimated Records: 66

---

### 8. Journey Mission Instances

Missions assigned to specific journey weeks with scheduling and status tracking.

```sql
CREATE TYPE mission_status AS ENUM ('not_started', 'in_progress', 'submitted', 'completed', 'rejected');

CREATE TABLE journey_mission_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_week_id UUID NOT NULL,
    mission_id UUID NOT NULL,
    release_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    status mission_status DEFAULT 'not_started',
    journey_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (journey_week_id) REFERENCES journey_weeks(id),
    FOREIGN KEY (mission_id) REFERENCES missions(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Links missions to specific weeks in journeys
- Release and expiry date scheduling
- Status tracking for mission lifecycle
- Estimated Records: 88

**Mission Status Values:**
- `not_started`: Mission not yet begun
- `in_progress`: Mission currently being worked on
- `submitted`: Mission submitted for review
- `completed`: Mission successfully completed
- `rejected`: Mission submission rejected

---

### 9. Teams

Team structure within journeys for collaborative learning.

```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);
```

**Key Features:**
- RLS Enabled: ❌
- Journey-specific team organization
- Estimated Records: 3

---

### 10. Team Members

Team membership with leadership roles.

```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_leader BOOLEAN DEFAULT false,
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);
```

**Key Features:**
- RLS Enabled: ❌
- Leadership designation support
- Membership tracking
- Estimated Records: 9

---

### 11. Posts

Student submissions for missions with scoring and team support.

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_instance_id UUID,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    team_id UUID,
    title TEXT NOT NULL,
    content TEXT,
    file_url TEXT,
    score INTEGER,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    is_team_submission BOOLEAN DEFAULT false,
    achievement_status TEXT DEFAULT 'pending' CHECK (achievement_status = ANY (ARRAY['pending', 'achieved', 'not_achieved'])),
    team_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    journey_id UUID,
    
    FOREIGN KEY (mission_instance_id) REFERENCES journey_mission_instances(id),
    FOREIGN KEY (user_id) REFERENCES profiles(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (journey_id) REFERENCES journeys(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Supports both individual and team submissions
- File attachment support
- Achievement status tracking
- View count analytics
- Content moderation (is_hidden)
- Estimated Records: 481

**Achievement Status Values:**
- `pending`: Awaiting review
- `achieved`: Successfully completed
- `not_achieved`: Did not meet requirements

---

### 12. Comments

Comments on posts for discussion and feedback.

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Threaded discussion support
- Estimated Records: 113

---

### 13. Likes

Like/reaction system for posts.

```sql
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Simple like/unlike functionality
- Estimated Records: 79

---

### 14. Notifications

User notification system with rich content support.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiver_id UUID NOT NULL,
    type TEXT NOT NULL,
    message VARCHAR NOT NULL,
    link TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    notification_json TEXT,
    
    FOREIGN KEY (receiver_id) REFERENCES profiles(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Rich notification content via JSON
- Read status tracking
- Deep linking support
- Estimated Records: 35

---

### 15. User Points

Individual user points tracking for missions and posts.

```sql
CREATE TABLE user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    mission_instance_id UUID NOT NULL,
    post_id UUID,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (profile_id) REFERENCES profiles(id),
    FOREIGN KEY (mission_instance_id) REFERENCES journey_mission_instances(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

**Key Features:**
- RLS Enabled: ❌
- Links points to specific missions and posts
- Supports cumulative scoring
- Estimated Records: 438

---

### 16. Team Points

Team-based points for collaborative missions.

```sql
CREATE TABLE team_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    mission_instance_id UUID NOT NULL,
    post_id UUID,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (mission_instance_id) REFERENCES journey_mission_instances(id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
```

**Key Features:**
- RLS Enabled: ❌
- Team-based scoring system
- Links to specific missions and posts
- Estimated Records: 1

---

### 17. Files

Centralized file management system for all file uploads with metadata tracking.

```sql
CREATE TYPE file_type AS ENUM ('image', 'document', 'video', 'audio', 'other');

CREATE TABLE files (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_type file_type NOT NULL,
    bucket_name TEXT NOT NULL DEFAULT 'images',
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Centralized file storage with metadata
- Soft deletion support with `is_deleted` flag
- File type classification system
- Bucket-based organization
- JSON metadata for additional file information
- File size and MIME type tracking
- Estimated Records: Growing with usage

**File Type Values:**
- `image`: Image files (JPEG, PNG, WebP, etc.)
- `document`: Document files (PDF, DOC, etc.)
- `video`: Video files
- `audio`: Audio files
- `other`: Miscellaneous file types

**Bucket Organization:**
- `images`: Primary bucket for image uploads
- Additional buckets can be configured as needed

**Helper Functions & Views:**
```sql
-- Function to upload files with automatic metadata extraction
CREATE OR REPLACE FUNCTION upload_file(
    p_user_id UUID,
    p_file_name TEXT,
    p_file_path TEXT,
    p_file_size BIGINT,
    p_mime_type TEXT,
    p_file_type file_type DEFAULT 'other',
    p_bucket_name TEXT DEFAULT 'images',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(file_id BIGINT, file_url TEXT);

-- View for active (non-deleted) files
CREATE VIEW active_files AS
SELECT * FROM files 
WHERE is_deleted = false;

-- View for file statistics
CREATE VIEW file_stats AS
SELECT 
    file_type,
    bucket_name,
    COUNT(*) as file_count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size
FROM active_files
GROUP BY file_type, bucket_name;
```

---

### 18. Bug Reports

User-submitted bug reports with status tracking.

```sql
CREATE TABLE bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    attachment_file_id BIGINT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (user_id) REFERENCES profiles(id),
    FOREIGN KEY (attachment_file_id) REFERENCES files(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- File attachment support for screenshots via centralized file system
- Dual support for legacy `file_url` and new `attachment_file_id`
- Status tracking for resolution
- Estimated Records: 6

---

### 18. Email Queue

Email notification queue for background processing.

```sql
CREATE TABLE email_queue (
    id SERIAL PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    content_ref_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    status_code INTEGER,
    response TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);
```

**Key Features:**
- RLS Enabled: ✅
- Background email processing
- Retry mechanism with error tracking
- Status and response logging
- Estimated Records: 20

---

### 19. Subscriptions

Push notification subscription management.

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_json TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);
```

**Key Features:**
- RLS Enabled: ✅
- Push notification subscription data
- JSON-based subscription configuration
- Estimated Records: 4

---

### 20. Blog

Blog content management system.

```sql
CREATE TABLE blog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    image_url TEXT DEFAULT 'https://picsum.photos/980/540'
);
```

**Key Features:**
- RLS Enabled: ✅
- Rich content blog system
- Default placeholder images
- Estimated Records: 4

---

### 21. Inquiry

Business inquiry form data for academy automation consultation.

```sql
CREATE TABLE inquiry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL COMMENT '신청자 이름',
    phone TEXT NOT NULL COMMENT '신청자 전화번호',
    automation_needs TEXT NOT NULL COMMENT '자동화하고 싶은 내용',
    current_tools TEXT COMMENT '현재 사용 중인 업무 툴',
    tool_issues TEXT COMMENT '사용 중인 툴의 문제점',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now() COMMENT '문의 생성 시각',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now() COMMENT '문의 수정 시각',
    status TEXT DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'processing', 'completed', 'cancelled'])) COMMENT '상담 처리 상태',
    notes TEXT COMMENT '관리자 메모'
) COMMENT '학원 자동화 상담 신청 정보';
```

**Key Features:**
- RLS Enabled: ✅
- Business inquiry management
- Status workflow tracking
- Admin notes support
- Estimated Records: 3

**Status Values:**
- `pending`: New inquiry awaiting processing
- `processing`: Currently being handled
- `completed`: Successfully completed
- `cancelled`: Cancelled inquiry

---

## Database Relationships

### Primary Relationships

1. **Organizations → Profiles**: One-to-many (multi-tenant structure)
2. **Journeys → Journey Weeks**: One-to-many (weekly organization)
3. **Journey Weeks → Journey Mission Instances**: One-to-many (mission scheduling)
4. **Missions → Journey Mission Instances**: One-to-many (mission templates)
5. **Users → User Journeys**: Many-to-many via junction table
6. **Journeys → Teams**: One-to-many (team organization)
7. **Teams → Team Members**: One-to-many (team membership)
8. **Posts → Comments**: One-to-many (discussion threads)
9. **Posts → Likes**: One-to-many (engagement tracking)
10. **Users → Files**: One-to-many (file ownership and management)

### File System Relationships

- **Profiles → Files**: One-to-many via `profile_image_file_id` (profile images)
- **Journeys → Files**: One-to-many via `image_file_id` (journey cover images)  
- **Bug Reports → Files**: One-to-many via `attachment_file_id` (bug report attachments)
- **Files → Users**: Many-to-one via `user_id` (file ownership tracking)

### Points System Relationships

- **User Points**: Links profiles to mission instances and posts
- **Team Points**: Links teams to mission instances and posts

### Notification Relationships

- **Notifications**: Direct user targeting
- **Subscriptions**: Push notification management
- **Email Queue**: Background email processing

---

## Row Level Security (RLS)

The following tables have RLS enabled for security:

✅ **RLS Enabled:**
- organizations
- profiles
- role_access_code
- journeys
- journey_weeks
- missions
- journey_mission_instances
- posts
- comments
- likes
- notifications
- files
- bug_reports
- email_queue
- subscriptions
- blog
- inquiry

❌ **RLS Disabled:**
- user_journeys
- teams
- team_members
- user_points
- team_points

---

## Key Features

### 1. Multi-Tenancy
- Organization-based data isolation
- Default organization fallback

### 2. Role-Based Access Control
- Three-tier role hierarchy (user → teacher → admin)
- Access code system for role elevation
- JWT token-based authentication

### 3. Learning Path Management
- Journey-based course structure
- Weekly organization of content
- Mission-based assignments

### 4. Flexible Mission System
- Reusable mission templates
- Instance-based scheduling
- Status tracking throughout lifecycle

### 5. Team Collaboration
- Journey-specific teams
- Leadership roles
- Team-based submissions and scoring

### 6. Engagement Features
- Comments and likes on posts
- View count tracking
- Achievement status system

### 7. Points & Gamification
- Individual and team points
- Mission-based scoring
- Post-based rewards

### 8. Communication System
- Rich notifications with JSON payloads
- Push notification subscriptions
- Email queue for background processing

### 9. Content Management
- Centralized file management system with metadata tracking
- File type classification and bucket organization
- Soft deletion with audit trails
- File attachments for posts and bug reports
- Blog system for announcements
- Content moderation capabilities

### 10. Business Features
- Bug reporting system
- Inquiry management for business leads
- Analytics tracking via view counts

---

## Development Guidelines

### Authentication Flow
1. Users sign up with email/password or social login
2. Profile completion required for social users
3. Role assignment via access codes
4. Organization selection during signup
5. JWT token management for session handling

### Data Access Patterns
- Use organization_id for multi-tenant filtering
- Implement role checks for sensitive operations
- Leverage RLS policies for row-level security
- Use journey_id for course-specific data isolation

### Points System
- User points track individual progress
- Team points support collaborative scoring
- Both link to specific mission instances and posts
- Consider aggregation for leaderboards

### Mission Lifecycle
1. **Template Creation**: Create reusable mission in `missions` table
2. **Scheduling**: Create instance in `journey_mission_instances`
3. **Release**: Set `release_date` for availability
4. **Submission**: Users create posts linked to mission instance
5. **Evaluation**: Update achievement status and scores
6. **Completion**: Update mission status to completed

---

This schema supports a comprehensive learning management system with enterprise features, team collaboration, gamification, and robust access control. The multi-tenant architecture allows for organization-based data isolation while maintaining a shared system for efficiency.