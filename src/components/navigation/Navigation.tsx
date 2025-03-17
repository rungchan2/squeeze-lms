"use client";

import { useAuth } from "@/components/AuthProvider";
import styled from "@emotion/styled";
import { useEffect, useState, useRef } from "react";
import { FaHome } from "react-icons/fa";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import { Logo } from "@/components/navigation/Logo";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { IconContainer } from "../common/IconContainer";
import { UserJourneyWithJourney } from "@/types";
import { getJourney } from "@/utils/journey";
import { Separator } from "@chakra-ui/react";

export function Navigation({ exceptionPath }: { exceptionPath: string[] }) {
  const { profileImage, id } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isException = exceptionPath.some((path) => pathname?.includes(path));
  const isJourney = pathname?.includes("journey");
  const [isVisible, setIsVisible] = useState(true);
  const [journeyList, setJourneyList] = useState<UserJourneyWithJourney[]>([]);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // 초기 스크롤 위치 설정
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // 스크롤 방향 감지
          const isScrollingDown = currentScrollY > lastScrollY.current;
          
          // 스크롤 방향에 따라 네비게이션 바 표시/숨김
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
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchJourneyList = async () => {
      if (id) {
        try {
          const journeyList = await getJourney(id);
          setJourneyList(journeyList as UserJourneyWithJourney[]);
        } catch (error) {
          console.error("Error fetching journey list:", error);
          setJourneyList([]);
        }
      }
    };
    fetchJourneyList();
  }, [id]);

  const onDropDownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const journeyId = e.target.value;
    router.push(`/journey/${journeyId}`);
  };

  return (
    <StyledNavigation $isVisible={isVisible && !isException}>
      <div className="left-container">
        {isJourney ? (
          <>
            <IconContainer onClick={() => router.push("/")} padding="6px">
              <FaHome size={20} />
            </IconContainer>
            <Separator orientation="vertical" height="100%" size="sm" />
            <select className="dropdown" onChange={onDropDownChange}>
              {journeyList && journeyList.length > 0 ? (
                journeyList.map((journey) => (
                  <option value={journey.journeys?.uuid} key={journey.id}>
                    {journey.journeys?.name}
                  </option>
                ))
              ) : (
                <option value={0} key={0}>
                  여행 없음
                </option>
              )}
            </select>
          </>
        ) : (
          <Logo width={100} />
        )}
      </div>
      <div className="right-container">
        <ProfileImage profileImage={profileImage} width={30} />
      </div>
    </StyledNavigation>
  );
}

const StyledNavigation = styled.div<{ $isVisible: boolean }>`
  .dropdown {
    background-color: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 5px;
    padding: 5px;
    width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    padding-right: 12px;
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

  .left-container {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 10px;
  }
`;
