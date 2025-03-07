"use client";

import Text from "@/components/Text/Text";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import Heading from "@/components/Text/Heading";
import styled from "@emotion/styled";
import { useSearchParams } from 'next/navigation'
import { socialLogout } from "@/utils/socialLogin";

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get('message') || '';
  const router = useRouter();

  const handleLogout = async () => {
    await socialLogout();
    router.push("/login");
  };

  return (
    <Container>
      <Heading level={2} color="var(--grey-700)" weight="bold" >Error</Heading>
      <Text variant="body" color="var(--grey-500)">{errorMessage}</Text>
      <Button variant="flat" onClick={handleLogout}>Login</Button>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 400px;
  margin: 0 auto;

  & > * {
    margin-bottom: 10px;
  }
`;
