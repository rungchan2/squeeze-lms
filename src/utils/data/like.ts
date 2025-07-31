import { createClient } from "@/utils/supabase/client";

interface LikeParams {
  postId: string;
  userId: string;
}

export interface LikesCountResponse {
  count: number;
}

// ✅ 좋아요 수만 가져오는 최적화된 함수
export async function getLikesCount(
  key: string,
  postId: string
): Promise<LikesCountResponse> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    throw error;
  }
  return { count: count || 0 };
}

// ✅ 좋아요 추가 함수
export async function addLike({ postId, userId }: LikeParams): Promise<void> {
  if (!postId || !userId) {
    return;
  }

  try {
    // 이미 좋아요가 있는지 확인
    const existingLike = await getUserLike(null, { postId, userId });
    if (existingLike) {
      return; // 이미 좋아요가 있으면 중복 추가 방지
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("likes")
      .insert([{ post_id: postId, user_id: userId }]);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("[addLike] 에러 발생:", err);
    throw err;
  }
}

// ✅ 좋아요 삭제 함수
export async function removeLike({ postId, userId }: LikeParams): Promise<void> {
  if (!postId || !userId) {
    return;
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("[removeLike] 에러 발생:", err);
    throw err;
  }
}

// ✅ 사용자가 좋아요 했는지 확인하는 함수
export async function getUserLike(_: any, params?: LikeParams) {
  // params가 undefined인 경우 early return
  if (!params || !params.postId || !params.userId) {
    return null;
  }

  const { postId, userId } = params;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data; // id가 있으면 좋아요 있음, null이면 없음
}
