import PostCard from "@/app/(home)/_mypage/PostCard";
import { useLikedPosts, PostType } from "@/hooks/usePosts2";
import Spinner from "@/components/common/Spinner";
import { Error } from "@/components/common/Error";
export default function MyPost() {
  const { data, isLoading: isMyPostsLoading, error } = useLikedPosts(PostType.MY_POSTS);
  if (isMyPostsLoading) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }
  if (error) {
    return <Error message={error.message} />;
  }
  if (data?.length === 0) {
    return <Error message="게시물이 없습니다." />;
  }

  return (
    <div className="postContainer">
      {data?.map((post: any) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
