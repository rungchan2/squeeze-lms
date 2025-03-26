import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Profile.module.css";
import defaultProfile from "@/assets/default-profile.png";

interface ProfileImageProps {
  profileImage: string | null;
  width?: number;
  size?: "small" | "medium" | "large" | "xlarge";
  blockClick?: boolean;
}

export function ProfileImage({
  profileImage,
  width,
  size = "medium",
  blockClick = false,
}: ProfileImageProps) {
  const imageUrl = profileImage || defaultProfile.src;
  const router = useRouter();

  const getResponsiveClass = () => {
    switch (size) {
      case "small":
        return styles.profileSmall;
      case "medium":
        return styles.profileMedium;
      case "large":
        return styles.profileLarge;
      case "xlarge":
        return styles.profileXLarge;
      default:
        return styles.profileMedium;
    }
  };

  return (
    <div
      className={`${styles.profileContainer} ${getResponsiveClass()}`}
      style={width ? { width: width, height: width } : {}}
      onClick={(e) => {
        if (blockClick) return;
        e.stopPropagation();
        router.push("/profile");
      }}
    >
      <Image
        src={imageUrl}
        alt="Profile Image"
        width={500}
        height={500}
        priority
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
