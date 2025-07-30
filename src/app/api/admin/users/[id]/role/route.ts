import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { apiGuards } from '@/utils/api/withApiGuard';

export const PUT = apiGuards.adminOnly(async (request: NextRequest, { user, params }) => {
  try {
    const userId = params?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const supabase = await createClient();

    // Update user's app metadata in auth.users
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { role }
      }
    );

    if (authError) {
      console.error('Error updating user role:', authError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Also update the role in profiles table if it exists there
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile role:', profileError);
      // Don't fail the request as the auth metadata is the source of truth
    }

    return NextResponse.json({ 
      success: true, 
      message: '사용자 권한이 변경되었습니다.' 
    });

  } catch (error) {
    console.error('Error in role update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});