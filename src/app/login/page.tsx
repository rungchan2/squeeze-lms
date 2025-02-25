"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { createClient } from "@/utils/supabase/client";
import { loginSchema } from "@/types";
import InputAndTitle from "@/components/InputAndTitle";
import Heading from "@/components/Text/Heading";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@chakra-ui/react";
import { HStack, Separator } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Image from "next/image";
import { socialLogin } from "@/utils/socialLogin";

const supabase = createClient();
const LoginContainer = styled.div`
  display: flex;
  max-width: 400px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0 auto;
  padding: 2rem;
  gap: 1rem;
`;

const LoginForm = styled.form`
  width: 100%;
  background: var(--gray-alpha-100);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.8rem;
  background: var(--foreground);
  color: var(--background);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #e11d48;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/");
    } catch (err) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await socialLogin('google');
      if (error) {
        setError("Google 로그인에 실패했습니다.");
      }
    } catch (err) {
      setError("Google 로그인 중 오류가 발생했습니다. error: " + err);
    }
  };

  return (
    <LoginContainer>
      <Heading level={1}>로그인</Heading>

      <GoogleLoginButton onClick={handleGoogleLogin}>
        <Image src="/google.svg" alt="Google" width={27} height={27} />
        <Text variant="body" color="var(--background)">
          Google로 로그인
        </Text>
      </GoogleLoginButton>
      <LoginForm onSubmit={handleSubmit(onSubmit)}>
        <HStack>
          <Separator flex="1" />
          <Text variant="caption" color="var(--grey-500)">
            또는
          </Text>
          <Separator flex="1" />
        </HStack>

        <InputAndTitle title="이메일">
          <Input type="email" placeholder="이메일" {...register("email")} />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
        </InputAndTitle>

        <InputAndTitle title="비밀번호">
          <PasswordInput />
          {/* <PasswordStrengthMeter value={4} /> */}
        </InputAndTitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </LoginForm>
    </LoginContainer>
  );
}

const GoogleLoginButton = styled.button`
  width: 100%;
  padding: 5px 15px;
  background: var(--foreground);
  color: var(--background);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  & > p {
    font-weight: 700;
  }
`;
