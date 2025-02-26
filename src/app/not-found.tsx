'use client'

import Link from 'next/link'
import styled from '@emotion/styled'

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  gap: 1rem;
`

const Title = styled.h1`
  font-size: 4rem;
  margin: 0;
  color: var(--foreground);
`

const Message = styled.p`
  font-size: 1.2rem;
  color: var(--foreground);
  opacity: 0.8;
`

const StyledLink = styled(Link)`
  padding: 0.8rem 1.6rem;
  background-color: var(--black);
  color: var(--white);
  border-radius: 8px;
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`

export default function NotFound() {
  return (
    <NotFoundContainer>
      <Title>404</Title>
      <Message>페이지를 찾을 수 없습니다</Message>
      <StyledLink href="/">홈으로 돌아가기</StyledLink>
    </NotFoundContainer>
  )
} 