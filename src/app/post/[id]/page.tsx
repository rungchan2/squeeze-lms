"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import PostCard from "@/components/home/mypage/PostCard";
import CommentSection from "./CommentSection";
import { useParams } from "next/navigation";
import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";

export default function PostPage() {
  const params = useParams();
  const postId = Number(params.id);
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
      <CommentSection />
    </PostPageContainer>
  );
}

const PostPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
`;
