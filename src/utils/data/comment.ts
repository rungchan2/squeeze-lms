import { createClient } from "../supabase/client";
import { CreateComment, UpdateComment, Comment } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { RefObject } from "react";

// 실시간 연결 설정을 위한 옵션
const REALTIME_CONFIG = {
  retryInterval: 1000,
  maxRetries: 5,
};

export async function getCommentsNumber(postId: number) : Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id", { count: "exact" })
    .eq("post_id", postId);

  if (error) throw error;
  return data.length;
} 

export async function createComment(newComment: CreateComment) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert(newComment)
    .select(
      `
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `
    )
    .single();

  if (error) throw error;
  return data;
}

export async function getComments(postId: number, pageSize: number = 10, page: number = 1) {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = page * pageSize - 1;
  const { data, error, count } = await supabase
    .from("comments")
    .select(
      `
      *,
      profiles:user_id (
        id,
        first_name,
        last_name,
        profile_image
      )
    `,
      { count: "exact" }
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
}

export async function deleteComment(commentId: number) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
  return data;
}

export async function updateComment(
  commentId: number,
  updatedComment: UpdateComment
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .update(updatedComment)
    .eq("id", commentId);

  if (error) throw error;
  return data;
}

export async function getCommentById(commentId: number) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("id", commentId);

  if (error) throw error;
  return data;
}

export async function addChannel(
  postId: number,
  mountedRef: RefObject<boolean>,
  recentlyProcessedIds: Set<number>,
  mutate: () => void
): Promise<RealtimeChannel> {
  const supabase = createClient();
  try {
    // 고정된 채널 이름 사용 (타임스탬프 제거)
    const channelName = `comments-${postId}`;
    console.log(`실시간 채널 설정: ${channelName}`);

    // 기존 채널 확인 및 정리
    const existingChannels = supabase.getChannels();
    let existingChannel: RealtimeChannel | null = null;
    
    // 이미 동일한 이름의 채널이 있는지 확인
    for (const ch of existingChannels) {
      if (ch.topic.includes(`realtime:${channelName}`)) {
        console.log(`기존 채널 발견: ${ch.topic}`);
        existingChannel = ch;
        break;
      }
    }

    // 이미 있는 채널은 재사용
    if (existingChannel) {
      console.log(`기존 채널 재사용: ${existingChannel.topic}`);
      
      // 이미 SUBSCRIBED 상태인 경우 재사용
      if ((existingChannel as any).state === "SUBSCRIBED") {
        console.log(`채널이 이미 구독 중입니다: ${existingChannel.topic}`);
        return existingChannel;
      }
      
      // CLOSED 상태이거나 다른 상태일 경우 안전하게 제거 후 새로 생성
      try {
        console.log(`기존 채널 제거: ${existingChannel.topic}`);
        await supabase.removeChannel(existingChannel);
      } catch (err) {
        console.error("기존 채널 제거 오류:", err);
      }
    }

    // 새 채널 생성
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log("실시간 INSERT 이벤트 수신:", payload);
          if (!mountedRef.current || !payload.new) return;

          const commentId = payload.new.id;

          // 이미 처리한 댓글인지 확인
          if (recentlyProcessedIds.has(commentId)) {
            console.log(`이미 처리된 댓글 무시: ${commentId}`);
            return;
          }

          console.log(`새 댓글 추가됨: ${commentId}, mutate 호출`);
          // 새 댓글이 추가되면 데이터 다시 불러오기
          mutate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log("실시간 DELETE 이벤트 수신:", payload);
          if (!mountedRef.current || !payload.old) return;

          const deletedId = (payload.old as Comment).id;

          // 이미 처리한 댓글인지 확인
          if (recentlyProcessedIds.has(deletedId)) {
            console.log(`이미 처리된 댓글 삭제 무시: ${deletedId}`);
            return;
          }

          console.log(`댓글 삭제됨: ${deletedId}, mutate 호출`);
          // 댓글이 삭제되면 데이터 다시 불러오기
          mutate();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          console.log("실시간 UPDATE 이벤트 수신:", payload);
          if (!mountedRef.current || !payload.new) return;

          const commentId = payload.new.id;

          // 이미 처리한 댓글인지 확인
          if (recentlyProcessedIds.has(commentId)) {
            console.log(`이미 처리된 댓글 업데이트 무시: ${commentId}`);
            return;
          }

          console.log(`댓글 업데이트됨: ${commentId}, mutate 호출`);
          // 댓글이 업데이트되면 데이터 다시 불러오기
          mutate();
        }
      );

    // 구독 시도 (한 번만 실행됨)
    try {
      await channel.subscribe((status, err) => {
        console.log(
          `실시간 채널 상태: ${status}${
            err ? `, 오류: ${err.message}` : ""
          }, 채널: ${channelName}`
        );

        // 연결이 끊어진 경우 
        if (status === "CLOSED" && mountedRef.current) {
          console.log(`채널이 닫혔습니다. 설정 함수가 다시 호출될 때 재연결됩니다.`);
          // 여기서 재구독 시도하지 않음 - 컴포넌트가 remount될 때 새 채널 생성
        }
      });
      console.log(`채널 구독 성공: ${channelName}`);
      return channel;
    } catch (subscribeError) {
      console.error("실시간 구독 오류:", subscribeError);
      throw subscribeError;
    }
  } catch (error) {
    console.error("실시간 채널 추가 오류:", error);
    throw error;
  }
}

export async function removeChannel(channel: RealtimeChannel) {
  try {
    if (!channel) return;
    console.log(`채널 제거: ${channel.topic}`);
    const supabase = createClient();
    await supabase.removeChannel(channel);
  } catch (error) {
    console.error("채널 제거 중 오류:", error);
  }
}
