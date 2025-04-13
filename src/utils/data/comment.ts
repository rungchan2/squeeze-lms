import { createClient } from "../supabase/client";
import { CreateComment, UpdateComment, Comment } from "@/types";
import { RealtimeChannel } from "@supabase/supabase-js";
import { RefObject } from "react";

// 개발 환경에서만 로그 출력 (환경 변수 사용)
const DEBUG = process.env.DEBUG_LOGS === 'true';

// 안전한 로그 출력 함수
function safeLog(message: string, ...args: any[]) {
  if (DEBUG) {
    console.log(message, ...args);
  }
}

// 전역으로 활성화된 채널을 추적하기 위한 Map
const activeChannels = new Map<string, RealtimeChannel>();


// 최대 활성 채널 수 제한
const MAX_ACTIVE_CHANNELS = 10;

export async function getCommentsNumber(postId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
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

export async function getComments(postId: string, pageSize: number = 10, page: number = 1) {
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

export async function deleteComment(commentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
  return data;
}

export async function updateComment(
  commentId: string,
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

export async function getCommentById(commentId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("id", commentId);

  if (error) throw error;
  return data;
}

export async function addChannel(
  postId: string,
  mountedRef: RefObject<boolean>,
  recentlyProcessedIds: Set<string>,
  onUpdate: () => void
): Promise<RealtimeChannel> {
  const supabase = createClient();
  const channelName = `comments-${postId}`;
  const fullChannelName = `realtime:${channelName}`;
  
  try {
    // 1. 먼저 전역 캐시에서 채널 확인
    if (activeChannels.has(fullChannelName)) {
      const cachedChannel = activeChannels.get(fullChannelName);
      if (cachedChannel) {
        safeLog(`전역 캐시에서 채널 재사용: ${fullChannelName}`);
        return cachedChannel;
      }
    }
    
    // 2. 활성 채널 수 확인 및 정리 (제한 초과 시)
    if (activeChannels.size >= MAX_ACTIVE_CHANNELS) {
      safeLog(`최대 채널 수 초과(${activeChannels.size}/${MAX_ACTIVE_CHANNELS}), 오래된 채널 정리`);
      
      // 가장 오래된 채널 제거 (FIFO)
      const oldestChannel = activeChannels.values().next().value;
      if (oldestChannel) {
        await removeChannel(oldestChannel);
      }
    }
    
    safeLog(`실시간 채널 설정: ${channelName}`);

    // 3. 기존 supabase 채널 확인 및 정리
    const existingChannels = supabase.getChannels();
    let existingChannel: RealtimeChannel | null = null;
    
    for (const ch of existingChannels) {
      if (ch.topic === fullChannelName) {
        safeLog(`기존 채널 발견: ${ch.topic}`);
        existingChannel = ch;
        break;
      }
    }

    // 기존 채널 처리
    if (existingChannel) {
      safeLog(`기존 채널 재사용: ${existingChannel.topic}`);
      
      // SUBSCRIBED 상태인 경우 재사용 및 전역 캐시에 추가
      if ((existingChannel as any).state === "SUBSCRIBED") {
        safeLog(`채널이 이미 구독 중입니다: ${existingChannel.topic}`);
        activeChannels.set(existingChannel.topic, existingChannel);
        return existingChannel;
      }
      
      // 다른 상태인 경우 제거
      try {
        safeLog(`비활성 채널 제거: ${existingChannel.topic}`);
        await supabase.removeChannel(existingChannel);
      } catch (err) {
        console.error("기존 채널 제거 오류:", err);
      }
    }

    // 4. 새 채널 생성
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
          safeLog("실시간 INSERT 이벤트 수신:", payload);
          if (!mountedRef.current || !payload.new) return;

          const commentId = payload.new.id;

          if (recentlyProcessedIds.has(commentId)) {
            safeLog(`이미 처리된 댓글 무시: ${commentId}`);
            return;
          }

          safeLog(`새 댓글 추가됨: ${commentId}`);
          onUpdate();
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
          safeLog("실시간 DELETE 이벤트 수신:", payload);
          if (!mountedRef.current || !payload.old) return;

          const deletedId = (payload.old as Comment).id;

          if (recentlyProcessedIds.has(deletedId)) {
            safeLog(`이미 처리된 댓글 삭제 무시: ${deletedId}`);
            return;
          }

          safeLog(`댓글 삭제됨: ${deletedId}`);
          onUpdate();
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
          safeLog("실시간 UPDATE 이벤트 수신:", payload);
          if (!mountedRef.current || !payload.new) return;

          const commentId = payload.new.id;

          if (recentlyProcessedIds.has(commentId)) {
            safeLog(`이미 처리된 댓글 업데이트 무시: ${commentId}`);
            return;
          }

          safeLog(`댓글 업데이트됨: ${commentId}`);
          onUpdate();
        }
      );

    // 5. 구독 시도
    try {
      await channel.subscribe((status, err) => {
        safeLog(
          `실시간 채널 상태: ${status}${
            err ? `, 오류: ${err.message}` : ""
          }, 채널: ${channelName}`
        );

        if (status === "CLOSED" && mountedRef.current) {
          safeLog(`채널이 닫혔습니다. 재구독 시도하지 않음`);
          // 전역 캐시에서도 제거
          if (activeChannels.has(channel.topic)) {
            activeChannels.delete(channel.topic);
            safeLog(`닫힌 채널을 전역 캐시에서 제거: ${channel.topic}`);
          }
        }
      });
      
      // 6. 전역 Map에 추가
      activeChannels.set(channel.topic, channel);
      safeLog(`채널 구독 성공 및 전역 캐시에 추가: ${channelName}, 현재 활성 채널 수: ${activeChannels.size}`);
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
    const channelName = channel.topic;
    
    safeLog(`실시간 채널 상태: ${channel.state}, 채널: ${channelName}`);
    if (!channel) return;
    safeLog(`채널 제거: ${channel.topic}`);

    // 특별 케이스 처리: 진행 중인 채널
    if (channel.state !== "closed") {
      // 구독 취소 및 연결 해제
      await channel.unsubscribe();
    }

    // 전역 캐시에서 제거
    if (activeChannels.has(channel.topic)) {
      activeChannels.delete(channel.topic);
      safeLog(`채널 닫힘: ${channel.topic}, 전역 캐시에서 제거`);
    }
  } catch (error) {
    console.error("Error removing channel:", error);
  }
}
