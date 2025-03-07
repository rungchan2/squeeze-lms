import { useAuthStore } from "@/store/auth";
import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import { Tabs, Tab } from "@/components/tab/Tabs";
import { ProfileImage } from "../../navigation/ProfileImage";
import Text from "@/components/Text/Text";
import { FiEdit } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { IconContainer } from "@/components/common/IconContainer";
import MyPost from "./MyPost";
import { BsFillAirplaneFill } from "react-icons/bs";
import { FaRegHeart } from "react-icons/fa6";
import { SideMenu, MenuItem } from "@/components/sidemenu/SideMenu";
import { useState } from "react";
import Link from "next/link";
import { Separator } from "@chakra-ui/react";
import { MdPrivacyTip, MdFeedback, MdLogout, MdLanguage } from "react-icons/md";
import { FaRegQuestionCircle } from "react-icons/fa";

export default function MyPage() {
  const { profileImage, email, fullName } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <PostContainer>
      <div className="header">
        <Heading level={2}>내 정보</Heading>
        <div className="iconContainer">
          <IconContainer padding="5px">
            <FiEdit />
          </IconContainer>
          <IconContainer padding="5px" onClick={() => setIsMenuOpen(true)}>
            <IoSettingsOutline />
            <SideMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              width="100%"
            >
              <MenuItem title="" icon={<MdLanguage />}>
                <Text>언어</Text>
              </MenuItem>
              <Link href="/bug-report">
                <MenuItem title="" icon={<IoSettingsOutline />}>
                  <Text>버그 신고</Text>
                </MenuItem>
              </Link>
              <Link href="/privacy-policy">
                <MenuItem title="" icon={<MdPrivacyTip />}>
                  <Text>개인정보처리방침</Text>
                </MenuItem>
              </Link>

              <MenuItem title="" icon={<MdLogout />}>
                <Text>로그아웃</Text>
              </MenuItem>
              <Separator style={{ margin: "10px 0" }} />
              <Link href="/feedback">
                <MenuItem title="" icon={<MdFeedback />}>
                  <Text>피드백</Text>
                </MenuItem>
              </Link>
              <Link href="/guide">
                <MenuItem title="" icon={<FaRegQuestionCircle />}>
                  <Text>가이드</Text>
                </MenuItem>
              </Link>
            </SideMenu>
          </IconContainer>
        </div>
      </div>
      <div className="mainContainer">
        <div className="profileContainer">
          <ProfileImage profileImage={profileImage || ""} width={100} />

          <div className="profileInfo">
            <Heading level={3}>
              안녕하세요 <br /> {fullName}님!
            </Heading>
            <Text variant="body" color="var(--grey-500)">
              {email}
            </Text>
          </div>
        </div>
        <Tabs usePath={false} defaultIndex={0}>
          <Tab title="내 게시글" icon={<BsFillAirplaneFill />}>
            <MyPost />
          </Tab>
          <Tab title="좋아요 게시글" icon={<FaRegHeart />}>
            <Text>좋아요 게시글</Text>
          </Tab>
        </Tabs>
      </div>
    </PostContainer>
  );
}

const PostContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

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
        gap: 5px;
      }
    }
  }
`;
