"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/initSupabase";
import { loginSchema } from "@/types/user.types";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import { Input } from "@chakra-ui/react";

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
`;

const LoginForm = styled.form`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: var(--gray-alpha-100);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1rem;
  color: var(--foreground);
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

      router.push("/dashboard");
    } catch (err) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    }
  };

  return (
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit(onSubmit)}>
        <Title>로그인</Title>

        <div>
          <Input type="email" placeholder="이메일" {...register("email")} />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
        </div>

        <div>
          <PasswordInput />
          <PasswordStrengthMeter value={2} />
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </LoginForm>
    </LoginContainer>
  );
}
