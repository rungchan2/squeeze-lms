import PostCard from "@/components/home/mypage/PostCard";
import styles from "./Mypage.module.css";
import { useMyPosts } from "@/hooks/usePosts";
import Spinner from "@/components/common/Spinner";

export default function MyPost() {
    const { data, isLoading: isMyPostsLoading, error } = useMyPosts();
    if (isMyPostsLoading) {
        return <div><Spinner /></div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className={styles.postContainer}>
            {data?.map((post: any) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}