import { 
  useSupabaseQuery, 
  useSupabaseInfiniteQuery,
  createMutation,
  createCacheKey,
  PaginatedResponse
} from '../base/useSupabaseQuery';
import { PostWithRelations, CreatePost, UpdatePost } from '@/types';
import { Database } from '@/types/database.types';
import { 
  getPost,
  createPost, 
  updatePost,
  deletePost,
  hidePost,
  unhidePost,
  addViewCount,
  getJourenyPosts,
  getPosts,
  getMyPosts,
  getMyLikedPosts,
  getCompletedMissions
} from '@/utils/data/posts';

// Database 타입 활용
type DatabasePost = Database['public']['Tables']['posts']['Row'];
type DatabasePostInsert = Database['public']['Tables']['posts']['Insert'];
type DatabasePostUpdate = Database['public']['Tables']['posts']['Update'];

// 게시물 목록 조회 (메인 피드)
export function usePostsRefactored(
  pageSize = 10, 
  journeySlug?: string, 
  includeTeacher = false
) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<PostWithRelations> | null) => {
    if (previousPageData && !previousPageData.nextPage) return null; // 끝에 도달
    return createCacheKey('posts', { 
      pageIndex, 
      pageSize, 
      journeySlug: journeySlug || 'all',
      includeTeacher 
    });
  };

  const fetcher = async (pageIndex: number, size: number): Promise<PaginatedResponse<PostWithRelations>> => {
    try {
      const result = await getPosts({
        pageIndex,
        pageSize: size,
        journeySlug,
        includeTeacher
      });
      
      return {
        data: result.data as PostWithRelations[],
        nextPage: result.nextPage,
        total: result.total
      };
    } catch (error) {
      throw error;
    }
  };

  return useSupabaseInfiniteQuery<PostWithRelations>(
    getKey,
    fetcher,
    pageSize
  );
}

// 단일 게시물 조회
export function usePostRefactored(postId: string | null) {
  return useSupabaseQuery<PostWithRelations>(
    postId ? createCacheKey('post', { postId }) : null,
    async () => {
      if (!postId) throw new Error('Post ID is required');
      
      const result = await getPost(postId);
      if (result.error) throw result.error;
      
      return result.data as PostWithRelations;
    }
  );
}

// 여정 게시물 조회
export function useJourneyPostsRefactored(journeyId: string | null) {
  return useSupabaseQuery<PostWithRelations[]>(
    journeyId ? createCacheKey('journey-posts', { journeyId }) : null,
    async () => {
      if (!journeyId) return [];
      
      const result = await getJourenyPosts(journeyId);
      if (result.error) throw result.error;
      
      return (result.data || []) as PostWithRelations[];
    }
  );
}

// 내 게시물 조회
export function useMyPostsRefactored(userId?: string) {
  return useSupabaseQuery<PostWithRelations[]>(
    userId ? createCacheKey('my-posts', { userId }) : null,
    async () => {
      if (!userId) return [];
      
      const result = await getMyPosts(userId);
      if (result.error) throw result.error;
      
      return (result.data || []) as PostWithRelations[];
    }
  );
}

// 좋아요한 게시물 조회  
export function useMyLikedPostsRefactored(userId?: string) {
  return useSupabaseQuery<PostWithRelations[]>(
    userId ? createCacheKey('my-liked-posts', { userId }) : null,
    async () => {
      if (!userId) return [];
      
      const result = await getMyLikedPosts(userId);
      if (result.error) throw result.error;
      
      return (result.data || []) as PostWithRelations[];
    }
  );
}

// 게시물 CRUD 액션들
export function usePostActionsRefactored() {
  // 게시물 생성
  const createPostMutation = createMutation<DatabasePost, CreatePost>(
    async (postData) => {
      const result = await createPost(postData);
      if (result.error) throw result.error;
      return result.data as DatabasePost;
    },
    {
      revalidateKeys: ['posts', 'journey-posts', 'my-posts']
    }
  );

  // 게시물 수정
  const updatePostMutation = createMutation<DatabasePost, { id: string; updates: UpdatePost }>(
    async ({ id, updates }) => {
      const result = await updatePost(updates, id);
      if (result.error) throw result.error;
      return result.data as DatabasePost;
    },
    {
      revalidateKeys: ['posts', 'post', 'journey-posts', 'my-posts']
    }
  );

  // 게시물 삭제
  const deletePostMutation = createMutation<boolean, string>(
    async (postId) => {
      const result = await deletePost(postId);
      if (result.error) throw result.error;
      return true;
    },
    {
      revalidateKeys: ['posts', 'post', 'journey-posts', 'my-posts']
    }
  );

  // 게시물 숨기기
  const hidePostMutation = createMutation<DatabasePost, string>(
    async (postId) => {
      const result = await hidePost(postId);
      if (result.error) throw result.error;
      return result.data as DatabasePost;
    },
    {
      revalidateKeys: ['posts', 'post', 'journey-posts']
    }
  );

  // 게시물 숨기기 해제
  const unhidePostMutation = createMutation<DatabasePost, string>(
    async (postId) => {
      const result = await unhidePost(postId);
      if (result.error) throw result.error;
      return result.data as DatabasePost;
    },
    {
      revalidateKeys: ['posts', 'post', 'journey-posts']
    }
  );

  // 조회수 증가
  const incrementViewCountMutation = createMutation<DatabasePost, { postId: string; currentCount: number }>(
    async ({ postId, currentCount }) => {
      const result = await addViewCount(postId, currentCount);
      if (result.error) throw result.error;
      return result.data as DatabasePost;
    },
    {
      revalidateKeys: ['post']
    }
  );

  return {
    createPost: createPostMutation,
    updatePost: updatePostMutation,
    deletePost: deletePostMutation,
    hidePost: hidePostMutation,
    unhidePost: unhidePostMutation,
    incrementViewCount: incrementViewCountMutation,
  };
}

// 완료된 미션 조회 (기존 호환성)
export function useCompletedMissionsRefactored(userId: string, journeySlug: string) {
  return useSupabaseQuery<string[]>(
    userId && journeySlug ? createCacheKey('completed-missions', { userId, journeySlug }) : null,
    async () => {
      if (!userId || !journeySlug) return [];
      
      const result = await getCompletedMissions(userId, journeySlug);
      if (result.error) throw result.error;
      
      return (result.data || []) as string[];
    }
  );
}

// 호환성을 위한 타입 별칭
export enum PostType {
  MY_POSTS = 'MY_POSTS',
  LIKED_POSTS = 'LIKED_POSTS'
}

// 기존 usePosts2.ts 호환성
export function useLikedPostsRefactored(type: PostType = PostType.LIKED_POSTS) {
  return useMyLikedPostsRefactored();
}