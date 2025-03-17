import PostCard from "@/components/home/mypage/PostCard";
import { usePosts } from "@/hooks/usePosts";
import styles from "./Mypage.module.css";

export default function MyPost() {
    const { data, error } = usePosts();

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