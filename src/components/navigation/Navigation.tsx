"use client";

import styled from "@emotion/styled";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { FaHome } from "react-icons/fa";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { Logo } from "@/components/navigation/Logo";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { IconContainer } from "../common/IconContainer";
import { Separator, Skeleton } from "@chakra-ui/react";
import { useJourneyBySlug } from "@/hooks/useJourneyBySlug";
import { Menu, Portal } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { userLogout } from "@/utils/data/auth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import NotificationRequest from "../Notification";
import { AdminOnly } from "@/components/auth/AdminOnly";

function NavigationComponent({ exceptionPath }: { exceptionPath: string[] }) {
  const {
    id,
    isAuthenticated,
    profileImage: profileImageFromAuth,
  } = useSupabaseAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isException = useMemo(
    () => exceptionPath.some((path) => pathname?.includes(path)),
    [exceptionPath, pathname]
  );

  const isJourney = useMemo(() => pathname?.includes("journey"), [pathname]);
  
  // Extract journey ID from pathname
  const journeyId = useMemo(() => {
    if (!isJourney) return null;
    const pathSegments = pathname?.split("/") || [];
    const journeyIndex = pathSegments.indexOf("journey");
    return journeyIndex !== -1 && pathSegments[journeyIndex + 1] 
      ? pathSegments[journeyIndex + 1] 
      : null;
  }, [pathname, isJourney]);

  const { journey, isLoading: journeyLoading } = useJourneyBySlug(journeyId || "");

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  // 스크롤 이벤트 핸들러 메모이제이션
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastScrollY.current;

        if (isScrollingDown && currentScrollY > 70) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });

      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);


  const handleLogout = useCallback(async () => {
    await userLogout();
    toaster.create({
      title: "로그아웃 되었습니다.",
      type: "success",
    });
    window.location.href = "/login";
  }, []);

  return (
    <StyledNavigation $isVisible={isVisible && !isException}>
      <div className="outside-container">
        <div className="left-container">
          {isJourney ? (
            <>
              <IconContainer onClick={() => router.push("/")} padding="6px">
                <FaHome size={20} />
              </IconContainer>
              <Separator orientation="vertical" height="100%" size="sm" />
              <div className="workspace-name">
                {journeyLoading ? (
                  <Skeleton height="20px" width="120px" />
                ) : (
                  <span>{journey?.name || "워크스페이스"}</span>
                )}
              </div>
            </>
          ) : (
            <Logo width={100} />
          )}
        </div>
        <div className="right-container">
          <NotificationRequest />
          <Menu.Root>
            <Menu.Trigger>
              <ProfileImage
                profileImage={profileImageFromAuth}
                width={30}
                blockClick={true}
                id={id}
              />
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item
                    value="profile"
                    onClick={() => router.push("/profile")}
                    style={{ cursor: "pointer" }}
                  >
                    내 프로필
                  </Menu.Item>
                  <AdminOnly>
                    <Menu.Item
                      value="admin"
                      onClick={() => router.push("/admin")}
                      style={{ cursor: "pointer" }}
                    >
                      관리자 페이지
                    </Menu.Item>
                  </AdminOnly>
                  <Menu.Item
                    value="bug-report"
                    onClick={() => router.push("/bug-report")}
                    style={{ cursor: "pointer" }}
                  >
                    버그 신고
                  </Menu.Item>
                  {isAuthenticated && (
                    <Menu.Item
                      value="logout"
                      color="fg.error"
                      _hover={{ bg: "bg.error", color: "fg.error" }}
                      onClick={handleLogout}
                      style={{ cursor: "pointer" }}
                    >
                      로그아웃
                    </Menu.Item>
                  )}
                  {!isAuthenticated && (
                    <Menu.Item
                      value="login"
                      onClick={() => router.push("/login")}
                      style={{ cursor: "pointer" }}
                    >
                      로그인
                    </Menu.Item>
                  )}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </div>
      </div>
    </StyledNavigation>
  );
}

// React.memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
export const Navigation = memo(NavigationComponent);

const StyledNavigation = styled.div<{ $isVisible: boolean }>`
  .workspace-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--gray-800);
    display: flex;
    align-items: center;
    min-width: 0;
    
    span {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      max-width: 200px;
    }
  }
  
  position: fixed;
  gap: 70px;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 70px;
  background-color: var(--white);
  padding: 20px;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  transform: translateY(${(props) => (props.$isVisible ? "0" : "-100%")});
  z-index: 1000;

  .right-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .outside-container {
    max-width: var(--breakpoint-tablet);
    gap: 70px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .left-container {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 10px;
  }
`;
