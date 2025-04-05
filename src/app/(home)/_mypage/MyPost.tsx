import PostCard from "@/app/(home)/_mypage/PostCard";
import styles from "./Mypage.module.css";
import { useMyPosts } from "@/hooks/usePosts";
import Spinner from "@/components/common/Spinner";
import { Error } from "@/components/common/Error";
export default function MyPost() {
  const { data, isLoading: isMyPostsLoading, error } = useMyPosts();
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
    <div className={styles.postContainer}>
      {data?.map((post: any) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
