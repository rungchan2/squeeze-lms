import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Profile.module.css";
import defaultProfile from "@/assets/default-profile.png";

export function ProfileImage({
  profileImage,
  width,
}: {
  profileImage: string | null;
  width: number;
}) {
  if (!profileImage) {
    profileImage = defaultProfile.src;
  }
  const router = useRouter();
  return (
    <div
      className={styles.profileContainer}
      style={{ width: width, height: width }}
      onClick={() => {
        router.push("/profile");
      }}
    >
      <Image
        src={profileImage}
        alt="Profile Image"
        width={width}
        height={width}
      />
    </div>
  );
}
