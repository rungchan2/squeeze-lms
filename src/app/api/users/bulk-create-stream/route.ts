import { NextRequest } from 'next/server';
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
  skipped: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  skippedUsers: Array<{
    row: number;
    email: string;
    reason: string;
  }>;
}

interface ProgressUpdate {
  type: 'progress' | 'result';
  current?: number;
  total?: number;
  email?: string;
  result?: BulkCreateResult;
}

export async function POST(request: NextRequest) {
  console.log('[BULK_CREATE_STREAM] API endpoint called');
  
  const encoder = new TextEncoder();
  const startTime = Date.now();
  const TIMEOUT_MS = 55000; // 55초로 설정 (60초 제한보다 5초 여유)
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient();
        
        // Check if user is admin
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          controller.enqueue(encoder.encode('data: {"error": "Unauthorized"}\n\n'));
          controller.close();
          return;
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          controller.enqueue(encoder.encode('data: {"error": "Admin access required"}\n\n'));
          controller.close();
          return;
        }

        const body = await request.json();
        const { users } = body;
        
        if (!users || !Array.isArray(users)) {
          controller.enqueue(encoder.encode('data: {"error": "Invalid data format"}\n\n'));
          controller.close();
          return;
        }

        // Get organizations for name-to-id mapping
        const { data: organizations, error: orgError } = await supabase
          .from('organizations')
          .select('id, name');

        if (orgError) {
          controller.enqueue(encoder.encode('data: {"error": "Failed to fetch organizations"}\n\n'));
          controller.close();
          return;
        }

        const orgNameToId = new Map(organizations.map(org => [org.name, org.id]));

        // Check for existing users
        const emails = users.map(u => u.email).filter(Boolean);
        const { data: existingUsers } = await supabase
          .from('profiles')
          .select('email')
          .in('email', emails);

        const existingEmails = new Set(existingUsers?.map(u => u.email) || []);

        const result: BulkCreateResult = {
          success: true,
          total: users.length,
          created: 0,
          failed: 0,
          skipped: 0,
          errors: [],
          skippedUsers: []
        };

        // Process each user
        for (let i = 0; i < users.length; i++) {
          // Check for timeout
          if (Date.now() - startTime > TIMEOUT_MS) {
            // Send timeout result with current progress
            const timeoutResult: BulkCreateResult = {
              ...result,
              success: false,
              errors: [
                ...result.errors,
                {
                  row: i + 1,
                  email: 'TIMEOUT',
                  error: `타임아웃으로 인해 ${i + 1}번째 이후 작업이 중단되었습니다. ${result.created}명은 성공적으로 생성되었습니다.`
                }
              ]
            };
            
            const timeoutUpdate: ProgressUpdate = {
              type: 'result',
              result: timeoutResult
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(timeoutUpdate)}\n\n`));
            controller.close();
            return;
          }
          
          const userData = users[i];
          
          try {
            // Check if user already exists
            if (existingEmails.has(userData.email)) {
              result.skipped++;
              result.skippedUsers.push({
                row: i + 1,
                email: userData.email,
                reason: '이미 존재하는 이메일입니다'
              });
              
              // Send progress update
              const progressUpdate: ProgressUpdate = {
                type: 'progress',
                current: i + 1,
                total: users.length,
                email: userData.email
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressUpdate)}\n\n`));
              continue;
            }

            // Map organization name to ID if needed
            if (userData.organization_name && !userData.organization_id) {
              const orgId = orgNameToId.get(userData.organization_name);
              if (!orgId) {
                throw new Error(`Organization not found: ${userData.organization_name}`);
              }
              userData.organization_id = orgId;
            }

            // Validate user data and force role to 'user'
            const validatedData = bulkCreateUserSchema.parse({
              ...userData,
              role: 'user'
            });

            // Create auth user using admin client
            const adminClient = createAdminClient();
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
              email: validatedData.email,
              password: validatedData.password,
              email_confirm: true,
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

            const { error: profileError } = await supabase
              .from('profiles')
              .insert(profileData);

            if (profileError) {
              // If profile creation fails, try to delete the auth user
              await adminClient.auth.admin.deleteUser(authData.user.id);
              throw new Error(`Profile creation failed: ${profileError.message}`);
            }

            result.created++;
            
            // Send progress update
            const progressUpdate: ProgressUpdate = {
              type: 'progress',
              current: i + 1,
              total: users.length,
              email: validatedData.email
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressUpdate)}\n\n`));

          } catch (error) {
            result.failed++;
            result.errors.push({
              row: i + 1,
              email: userData.email || 'Unknown',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            // Send progress update
            const progressUpdate: ProgressUpdate = {
              type: 'progress',
              current: i + 1,
              total: users.length,
              email: userData.email
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressUpdate)}\n\n`));
          }
        }

        if (result.failed > 0) {
          result.success = false;
        }

        // Send final result
        const finalUpdate: ProgressUpdate = {
          type: 'result',
          result: result
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalUpdate)}\n\n`));
        controller.close();

      } catch (error) {
        console.error('[BULK_CREATE_STREAM] Error:', error);
        controller.enqueue(encoder.encode(`data: {"error": "Internal server error"}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}