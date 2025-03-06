import Heading from "@/components/Text/Heading";
import PostCard from "./PostCard";
import { usePosts } from "@/hooks/usePosts";

export default function MyPage() {
  const { data } = usePosts();
  return (
    <div>
      <Heading level={2}>내 정보</Heading>
      {data?.map((post) => (
        <PostCard 
          key={post.id}
          {...post}
        />
      ))}
    </div>
  );
}
