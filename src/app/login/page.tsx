"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import { HStack, Separator } from "@chakra-ui/react";
import Image from "next/image";
import { socialLogin } from "@/utils/socialLogin";
import { Modal } from "@/components/common/modal/Modal";
import LoginSignup from "@/components/common/auth/LoginSignup";
import Text from "@/components/Text/Text";
export default function LoginPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    try {
      const { error } = await socialLogin("google");
      if (error) {
        setError("Google 로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("Google 로그인 중 오류가 발생했습니다. error: " + err);
    }
  };

  return (
    <LoginContainer>
      <div className="login-container">
        <Heading level={2}>로그인</Heading>
        <GoogleLoginButton onClick={handleGoogleLogin}>
          <Image src="/google.svg" alt="Google" width={27} height={27} />
          <Text weight="bold" color="var(--background)">
            Google로 로그인
          </Text>
        </GoogleLoginButton>
        {error && <Text variant="caption" color="var(--negative-500)" style={{ textAlign: "center" }}>{error}</Text>}
        <HStack width="100%" style={{ marginTop: "10px" }}>
          <Separator 
            flex="1" 
            borderColor="gray.300"
            borderWidth="1px"
          />
          <Text variant="caption" color="var(--grey-500)">또는</Text>
          <Separator 
            flex="1" 
            borderColor="gray.300"
            borderWidth="1px"
          />
        </HStack>

        <LoginSignup type="login" />
      </div>
      <div className="signup-link">
        계정이 없으신가요? <p onClick={() => setIsOpen(true)}>회원가입</p>
      </div>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Heading level={3}>회원가입</Heading>
        <LoginSignup type="signup" />
      </Modal>
    </LoginContainer>
  );
}
const LoginContainer = styled.div`
  display: flex;
  max-width: 500px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0 auto;
  padding: 16px;
  gap: 10px;

  & > .login-container {
    border: 1px solid var(--grey-300);
    width: 100%;
    background-color: var(--white);
    padding: 32px 27px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: column;
  }
  & > .signup-link {
    margin-top: 10px;
    font-size: 12px;
    color: var(--grey-500);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    & > p {
      color: var(--primary-700);
      font-weight: 700;
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const GoogleLoginButton = styled.button`
  margin: 10px 0;
  width: 100%;
  padding: 5px 15px;
  background: var(--black);
  color: var(--white);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
`;