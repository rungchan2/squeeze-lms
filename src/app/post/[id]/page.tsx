"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import PostCard from "@/app/(home)/_mypage/PostCard";
import CommentSection from "./CommentSection";
import { useParams } from "next/navigation";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("*, profiles(*), mission_instance_id(*)")
          .eq("id", postId)
          .single();

        if (error) {
          throw error;
        }

        setPost(data);
        
        // 조회수 증가
        await supabase
          .from("posts")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", postId);
      } catch (err: any) {
        console.error("게시물 로드 오류:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (postId) {
      fetchPost();
    }
  }, [postId, supabase]);

  if (loading) return <div className="p-4 flex justify-center"><Spinner size="medium" /></div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!post) return <div>게시물을 찾을 수 없습니다.</div>;

  return (
    <PostPageContainer>
      <PostCard post={post} showDetails={true} />
      <CommentContainer>
        <CommentSection 
          postId={params.id as string}
          enableRealtime={true}
        />
      </CommentContainer>
    </PostPageContainer>
  );
}

const PostPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  position: relative;
  padding-bottom: 120px; /* 댓글 입력 영역의 높이만큼 여백 */
`;

const CommentContainer = styled.div`
  margin-top: 1rem;
`;
