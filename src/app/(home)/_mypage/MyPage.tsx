import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import Text from "@/components/Text/Text";
import { FiEdit } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { IconContainer } from "@/components/common/IconContainer";
import MyPost from "./MyPost";
import { BsFillAirplaneFill } from "react-icons/bs";
import { FaRegHeart } from "react-icons/fa6";
import { SideMenu, MenuItem } from "@/components/sidemenu/SideMenu";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Separator } from "@chakra-ui/react";
import { MdPrivacyTip, MdFeedback, MdLogout } from "react-icons/md";
import { FaRegQuestionCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useMyLikedPosts } from "@/hooks/usePosts";
import PostCard from "./PostCard";
import { getOrganizationById } from "@/utils/data/organization";
import { Error } from "@/components/common/Error";
import constants from "@/utils/constants";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { MdAdminPanelSettings } from "react-icons/md";
import { Tabs } from "@chakra-ui/react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { userLogout } from "@/utils/data/auth";
export default function MyPage() {
  const [orgData, setOrgData] = useState<any>(null);
  const { data: myLikedPosts } = useMyLikedPosts();
  const router = useRouter();
  const { profileImage, organizationId, user, lastName, firstName } =
    useSupabaseAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchOrgData = async () => {
      if (!organizationId) {
        return;
      }
      
      const { data, error } = await getOrganizationById(
        organizationId
      );
      if (error) {
        console.error("Error fetching organization data:", error);
      } else {
        setOrgData(data);
      }
    };
    fetchOrgData();
  }, [organizationId]);

  const handleLogout = useCallback(() => {
    userLogout();
    router.push("/login");
  }, [router]);
  return (
    <PostContainer>
      <div className="header">
        <Heading level={3}>내 정보</Heading>
        <div className="iconContainer">
          <IconContainer padding="5px" onClick={() => router.push("/profile")}>
            <FiEdit />
          </IconContainer>
          {/* <Menu.Root positioning={{ getAnchorRect }}>
            <Menu.Trigger asChild>
              <IconContainer padding="5px" ref={ref}>
                <MdLanguage />
              </IconContainer>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="Korean">한국어</Menu.Item>
                  <Menu.Item value="English">English</Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root> */}
          <IconContainer padding="5px" onClick={() => setIsMenuOpen(true)}>
            <IoSettingsOutline />
            <SideMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              width="100%"
            >
              <Link href={`${constants.PRIVACY_POLICY_URL}`}>
                <MenuItem title="" icon={<MdPrivacyTip />}>
                  <Text>개인정보처리방침</Text>
                </MenuItem>
              </Link>
              <Link href="/bug-report">
                <MenuItem title="" icon={<MdFeedback />}>
                  <Text>피드백</Text>
                </MenuItem>
              </Link>
              <Link href={`${constants.GUIDE_URL}`}>
                <MenuItem title="" icon={<FaRegQuestionCircle />}>
                  <Text>가이드</Text>
                </MenuItem>
              </Link>
              <AdminOnly>
                <Link href={`/admin`}>
                  <MenuItem title="" icon={<MdAdminPanelSettings />}>
                    <Text>어드민 페이지</Text>
                  </MenuItem>
                </Link>
              </AdminOnly>
              <Separator style={{ margin: "10px 0" }} />
              <MenuItem title="" icon={<MdLogout />} onClick={handleLogout}>
                <Text>로그아웃</Text>
              </MenuItem>
            </SideMenu>
          </IconContainer>
        </div>
      </div>
      <div className="mainContainer">
        <div className="profileContainer">
          <ProfileImage profileImage={profileImage || ""} width={80} />

          <div className="profileInfo">
            <Heading level={4}>
              안녕하세요 <br /> {lastName}{firstName}님!
            </Heading>
            <Text
              variant="body"
              color="var(--grey-500)"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
            >
              {user?.email}
            </Text>
            <Text
              variant="body"
              color="var(--grey-500)"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
            >
              {!organizationId 
                ? "조직 정보가 없습니다." 
                : orgData 
                  ? `(${orgData[0]?.name})` 
                  : "(조직 정보를 불러오는 중입니다.)"
              }
            </Text>
          </div>
        </div>
        <Tabs.Root key="line" defaultValue="myPosts" variant="line" fitted>
          <Tabs.List>
            <Tabs.Trigger value="myPosts">
              <BsFillAirplaneFill />내 게시글
            </Tabs.Trigger>
            <Tabs.Trigger value="likedPosts">
              <FaRegHeart />
              좋아요 게시글
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="myPosts">
            <MyPost />
          </Tabs.Content>
          <Tabs.Content value="likedPosts">
            {myLikedPosts?.length === 0 ? (
              <Error message="좋아요 게시글이 없습니다." />
            ) : (
              <div className="postContainer">
                {myLikedPosts?.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </PostContainer>
  );
}

const PostContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .postContainer {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .iconContainer {
      display: flex;
      gap: 5px;
      width: fit-content;
    }
  }

  .mainContainer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: var(--white);
    border-radius: 10px;
    padding: 30px 16px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    gap: 15px;

    .profileContainer {
      display: flex;
      gap: 10px;
      align-items: center;
      gap: 15px;

      .profileInfo {
        display: flex;
        flex-direction: column;
      }
    }
  }
`;
