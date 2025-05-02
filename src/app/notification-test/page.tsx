"use client";

import React from "react";
import NotificationTest from "@/components/NotificationTest";
import styled from "@emotion/styled";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

export default function NotificationTestPage() {
  return (
    <PageContainer>
      <h1>웹 푸시 알림 테스트 페이지</h1>
      <p>이 페이지에서 웹 푸시 알림을 테스트할 수 있습니다.</p>
      
      <NotificationTest />
    </PageContainer>
  );
} 