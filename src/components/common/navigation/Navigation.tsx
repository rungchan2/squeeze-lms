"use client";

import { useAuthStore } from "@/store/auth";
import styled from "@emotion/styled";
import { useEffect } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { ProfileImage } from "@/components/common/navigation/ProfileImage";
import { Logo } from "@/components/common/navigation/Logo";
export function Navigation() {
  const { fetchUser, profileImage } = useAuthStore();
  useEffect(() => {
    fetchUser();
  }, []);
  return (
    <StyledNavigation>
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

const StyledNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: var(--white);
  padding: 20px 20px;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);

  .left-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;
