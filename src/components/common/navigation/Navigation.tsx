"use client";

import { useAuthStore } from "@/store/auth";
import styled from "@emotion/styled";
import { useEffect, useState, useRef } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { ProfileImage } from "@/components/common/navigation/ProfileImage";
import { Logo } from "@/components/common/navigation/Logo";

export function Navigation() {
  const { fetchUser, profileImage } = useAuthStore();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const upScrollThreshold = 30;   // 위로 스크롤할 때의 임계값
  const downScrollThreshold = 150; // 아래로 스크롤할 때의 임계값

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
      const isScrollingUp = currentScrollY < lastScrollY.current;
      
      // 스크롤 방향에 따라 다른 임계값 적용
      const threshold = isScrollingUp ? upScrollThreshold : downScrollThreshold;
      
      if (scrollDifference > threshold) {
        if (isScrollingUp) {
          // 위로 스크롤 - 더 빠르게 나타남
          setIsVisible(true);
        } else {
          // 아래로 스크롤 - 더 천천히 숨겨짐
          setIsVisible(false);
        }
        
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <StyledNavigation $isVisible={isVisible}>
      <div className="left-container">
        <FaChevronLeft />
        <Logo width={100} />
      </div>
      <div className="right-container">
        <ProfileImage profileImage={profileImage} width={30} />
      </div>
    </StyledNavigation>
  );
}

const StyledNavigation = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 70px;
  background-color: var(--white);
  padding: 0 20px;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  transform: translateY(${props => props.$isVisible ? '0' : '-100%'});
  z-index: 1000;

  min-height: 70px;
  
  .left-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  & + * {
    padding-top: 70px;
  }
`;
