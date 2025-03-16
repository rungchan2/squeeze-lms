import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Comment, CreateComment } from '@/types/comments';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseCommentsProps {
  postId: number;
}

// 전역 상태로 댓글 캐시 관리
const commentsCache: Record<number, Comment[]> = {};
// 최근 생성/삭제된 댓글 ID를 추적 (중복 처리 방지)
const recentlyProcessedIds = new Set<number>();

export function useComments({ postId }: UseCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(commentsCache[postId] || []);
  const [count, setCount] = useState<number>(commentsCache[postId]?.length || 0);
  const [loading, setLoading] = useState<boolean>(!commentsCache[postId]);
  const [error, setError] = useState<string | null>(null);
  const { id: userId, profileImage, fullName } = useAuth();
  const supabase = createClient();
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);

  // 댓글 가져오기 함수
  const fetchComments = useCallback(async () => {
    if (!postId || !mountedRef.current) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!mountedRef.current) return;

      // 캐시 및 상태 업데이트
      commentsCache[postId] = data || [];
      setComments(data || []);
      setCount(data?.length || 0);
    } catch (err: any) {
      console.error('댓글 가져오기 오류:', err.message);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [postId, supabase]);

  // 댓글 생성 함수
  const createComment = useCallback(async (content: string) => {
    if (!userId || !postId || !mountedRef.current) {
      setError('로그인이 필요합니다.');
      return null;
    }

    // 낙관적 업데이트를 위한 임시 댓글 생성
    const tempId = Date.now();
    const [firstName, lastName] = fullName ? fullName.split(' ') : ['', ''];
    const optimisticComment: Comment = {
      id: tempId,
      content,
      user_id: userId,
      post_id: postId,
      created_at: new Date().toISOString(),
      updated_at: null,
      profiles: {
        id: userId,
        first_name: firstName,
        last_name: lastName,
        profile_image: profileImage
      }
    };

    // 낙관적 업데이트 적용
    setComments(prev => {
      const newComments = [optimisticComment, ...prev];
      commentsCache[postId] = newComments;
      return newComments;
    });
    setCount(prev => prev + 1);

    try {
      const newComment: CreateComment = {
        content,
        user_id: userId,
        post_id: postId,
      };

      const { data, error } = await supabase
        .from('comments')
        .insert(newComment)
        .select(`
          *,
          profiles:user_id (
            id,
            first_name,
            last_name,
            profile_image
          )
        `)
        .single();

      if (error) throw error;
      if (!mountedRef.current) return null;

      // 추가된 댓글 ID를 Set에 추가 (중복 처리 방지)
      if (data?.id) {
        recentlyProcessedIds.add(data.id);
        setTimeout(() => {
          recentlyProcessedIds.delete(data.id);
        }, 5000); // 5초 후 제거
      }

      // 낙관적 업데이트로 추가된 임시 댓글을 실제 댓글로 교체
      setComments(prev => {
        const newComments = prev.map(comment => 
          comment.id === tempId ? data : comment
        );
        commentsCache[postId] = newComments;
        return newComments;
      });
      
      return data;
    } catch (err: any) {
      console.error('댓글 생성 오류:', err.message);
      
      // 에러 발생 시 낙관적 업데이트 롤백
      if (mountedRef.current) {
        setComments(prev => {
          const newComments = prev.filter(comment => comment.id !== tempId);
          commentsCache[postId] = newComments;
          return newComments;
        });
        setCount(prev => prev - 1);
        setError(err.message);
      }
      return null;
    }
  }, [userId, postId, fullName, profileImage, supabase]);

  // 댓글 삭제 함수
  const deleteComment = useCallback(async (commentId: number) => {
    if (!userId || !mountedRef.current) {
      setError('로그인이 필요합니다.');
      return false;
    }

    // 삭제할 댓글 찾기
    const commentToDelete = comments.find(comment => comment.id === commentId);
    if (!commentToDelete) return false;

    // 낙관적 업데이트 적용
    setComments(prev => {
      const newComments = prev.filter(comment => comment.id !== commentId);
      commentsCache[postId] = newComments;
      return newComments;
    });
    setCount(prev => prev - 1);

    // 중복 처리 방지를 위해 ID 추가
    recentlyProcessedIds.add(commentId);
    setTimeout(() => {
      recentlyProcessedIds.delete(commentId);
    }, 5000); // 5초 후 제거

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      console.error('댓글 삭제 오류:', err.message);
      
      // 에러 발생 시 낙관적 업데이트 롤백
      if (mountedRef.current && commentToDelete) {
        setComments(prev => {
          const newComments = [...prev, commentToDelete].sort((a, b) => 
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          );
          commentsCache[postId] = newComments;
          return newComments;
        });
        setCount(prev => prev + 1);
        setError(err.message);
      }
      return false;
    }
  }, [userId, postId, supabase, comments]);

  // 실시간 구독 설정
  useEffect(() => {
    if (!postId) return;
    
    mountedRef.current = true;

    // 최초 데이터 로드
    fetchComments();

    // 실시간 채널 설정
    const setupRealtimeSubscription = async () => {
      if (realtimeChannelRef.current) {
        await supabase.removeChannel(realtimeChannelRef.current);
      }

      const channel = supabase
        .channel(`comments-${postId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments',
            filter: `post_id=eq.${postId}`
          }, 
          async (payload) => {
            if (!mountedRef.current || !payload.new) return;
            
            const commentId = payload.new.id;
            
            // 이미 처리한 댓글인지 확인
            if (recentlyProcessedIds.has(commentId)) return;
            
            try {
              // 댓글 작성자 정보 가져오기
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, profile_image')
                .eq('id', payload.new.user_id)
                .single();

              if (!mountedRef.current) return;

              const newComment: Comment = {
                ...payload.new as Comment,
                profiles: profileData || undefined
              };

              // 이미 같은 ID의 댓글이 있는지 확인
              setComments(prev => {
                if (prev.some(comment => comment.id === newComment.id)) {
                  return prev;
                }
                const newComments = [newComment, ...prev];
                commentsCache[postId] = newComments;
                return newComments;
              });
              setCount(prev => prev + 1);
            } catch (err) {
              console.error('실시간 댓글 처리 오류:', err);
            }
          }
        )
        .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'comments',
            filter: `post_id=eq.${postId}`
          }, 
          (payload) => {
            if (!mountedRef.current || !payload.old) return;
            
            const deletedId = (payload.old as Comment).id;
            
            // 이미 처리한 댓글인지 확인
            if (recentlyProcessedIds.has(deletedId)) return;
            
            setComments(prev => {
              const newComments = prev.filter(comment => comment.id !== deletedId);
              if (newComments.length !== prev.length) {
                commentsCache[postId] = newComments;
                setCount(c => c - 1);
              }
              return newComments;
            });
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
    };

    setupRealtimeSubscription();

    // 클린업 함수
    return () => {
      mountedRef.current = false;
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [postId, supabase, fetchComments]); // comments 의존성 제거

  return {
    comments,
    count,
    loading,
    error,
    createComment,
    deleteComment,
    refreshComments: fetchComments,
  };
} 