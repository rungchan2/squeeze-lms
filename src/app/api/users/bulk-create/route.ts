import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/utils/supabase/server';
import { z } from 'zod';

const bulkCreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  organization_name: z.string().optional(),
  role: z.enum(['user', 'teacher', 'admin']).optional().default('user'),
}).refine((data) => data.organization_id || data.organization_name, {
  message: "Either organization_id or organization_name must be provided",
});

interface BulkCreateResult {
  success: boolean;
  total: number;
  created: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export async function POST(request: NextRequest) {
  console.log('[BULK_CREATE] API endpoint called');
  
  try {
    const supabase = await createClient();
    
    console.log('[BULK_CREATE] Starting bulk user creation request');
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[BULK_CREATE] Auth check result:', { user: user?.id, authError: authError?.message });
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[BULK_CREATE] Profile check result:', { profile, profileError: profileError?.message });

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    console.log('[BULK_CREATE] Request body received:', { 
      hasUsers: !!body?.users, 
      userCount: body?.users?.length 
    });
    
    const { users } = body;
    
    console.log('[BULK_CREATE] Processing users count:', users?.length);

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Get all organizations for name-to-id mapping
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name');

    console.log('[BULK_CREATE] Organizations fetch result:', { 
      count: organizations?.length, 
      orgError: orgError?.message 
    });

    if (orgError) {
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    const orgNameToId = new Map(organizations.map(org => [org.name, org.id]));

    const result: BulkCreateResult = {
      success: true,
      total: users.length,
      created: 0,
      failed: 0,
      errors: []
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      
      console.log(`[BULK_CREATE] Processing user ${i + 1}:`, { 
        email: userData.email,
        organization_name: userData.organization_name,
        organization_id: userData.organization_id,
        role: userData.role 
      });
      
      try {
        // Map organization name to ID if needed
        if (userData.organization_name && !userData.organization_id) {
          const orgId = orgNameToId.get(userData.organization_name);
          console.log(`[BULK_CREATE] Organization mapping:`, { 
            organization_name: userData.organization_name, 
            found_id: orgId 
          });
          if (!orgId) {
            throw new Error(`Organization not found: ${userData.organization_name}`);
          }
          userData.organization_id = orgId;
        }

        // Validate user data and force role to 'user' for bulk creation
        const validatedData = bulkCreateUserSchema.parse({
          ...userData,
          role: 'user' // Force all bulk-created users to be regular users
        });
        console.log(`[BULK_CREATE] Validated data for ${validatedData.email}`, {
          role: validatedData.role
        });

        // Create auth user using admin client
        console.log(`[BULK_CREATE] Creating auth user:`, {
          email: validatedData.email,
          email_confirm: true
        });
        
        const adminClient = createAdminClient();
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: validatedData.email,
          password: validatedData.password,
          email_confirm: true,
        });

        console.log(`[BULK_CREATE] Auth creation result:`, {
          email: validatedData.email,
          success: !!authData.user,
          user_id: authData.user?.id,
          error: authError?.message,
          error_details: authError
        });

        if (authError) {
          throw new Error(`Auth creation failed: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('User creation failed: No user returned');
        }

        // Create profile
        const profileData = {
          id: authData.user.id,
          email: validatedData.email,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone: validatedData.phone || '',
          role: validatedData.role,
          organization_id: validatedData.organization_id,
          profile_image: null,
          marketing_opt_in: false,
          privacy_agreed: true,
        };

        console.log(`[BULK_CREATE] Creating profile:`, profileData);

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData);

        console.log(`[BULK_CREATE] Profile creation result:`, {
          email: validatedData.email,
          success: !profileError,
          error: profileError?.message,
          error_details: profileError
        });

        if (profileError) {
          // If profile creation fails, try to delete the auth user
          console.log(`[BULK_CREATE] Deleting auth user due to profile error:`, authData.user.id);
          await adminClient.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        console.log(`[BULK_CREATE] Successfully created user:`, validatedData.email);
        result.created++;
      } catch (error) {
        console.log(`[BULK_CREATE] Error processing user ${i + 1}:`, {
          email: userData.email,
          error: error instanceof Error ? error.message : 'Unknown error',
          error_details: error
        });
        result.failed++;
        result.errors.push({
          row: i + 1,
          email: userData.email || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    if (result.failed > 0) {
      result.success = false;
    }

    console.log('[BULK_CREATE] Final result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[BULK_CREATE] Top-level error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error_details: error
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}