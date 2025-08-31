-- Posts table RLS policies update
-- This SQL should be executed in Supabase SQL Editor to update posts table permissions

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can only update own posts" ON posts;
DROP POLICY IF EXISTS "Posts update policy for users teachers admins" ON posts;

-- Create new update policy that allows:
-- 1. Users to update their own posts
-- 2. Teachers to update posts within their organization  
-- 3. Admins to update posts within their organization
CREATE POLICY "Posts update policy for users teachers admins" 
ON posts FOR UPDATE 
USING (
  -- User can update their own posts
  auth.uid() = user_id OR 
  -- Teachers and admins can update posts within same organization
  (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.id = auth.uid() 
      AND p2.id = posts.user_id
      AND p1.role IN ('teacher', 'admin')
    )
  )
);

-- Ensure SELECT policy allows teachers and admins to view posts in their organization
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON posts; 
DROP POLICY IF EXISTS "Posts are viewable by organization members" ON posts;
DROP POLICY IF EXISTS "Posts view policy for organization members" ON posts;

CREATE POLICY "Posts view policy for organization members" 
ON posts FOR SELECT 
USING (
  -- User can view their own posts
  auth.uid() = user_id OR
  -- Organization members can view posts within their organization  
  (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.id = auth.uid() 
      AND p2.id = posts.user_id
    )
  )
);

-- Optional: Add DELETE policy for teachers and admins
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Posts delete policy for users teachers admins" ON posts;

CREATE POLICY "Posts delete policy for users teachers admins" 
ON posts FOR DELETE 
USING (
  -- User can delete their own posts
  auth.uid() = user_id OR 
  -- Teachers and admins can delete posts within same organization
  (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.organization_id = p2.organization_id
      WHERE p1.id = auth.uid() 
      AND p2.id = posts.user_id
      AND p1.role IN ('teacher', 'admin')
    )
  )
);

-- Verify policies are applied correctly
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY cmd, policyname;