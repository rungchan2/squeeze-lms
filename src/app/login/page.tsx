"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/types";
import InputAndTitle from "@/components/InputAndTitle";
import Heading from "@/components/Text/Heading";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@chakra-ui/react";
import { HStack, Separator } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Image from "next/image";
import { socialLogin } from "@/utils/socialLogin";
import Button from "@/components/common/Button";
import { signInWithEmail } from "@/utils/socialLogin";
import { DevTool } from "@hookform/devtools";

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const email = watch("email");
  const password = watch("password");

  const onSubmit = async (data: LoginFormData) => {
    try {
      signInWithEmail(data.email, data.password);
      router.push("/");
    } catch (err) {
      console.log(err);
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    }
  };

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

        <LoginForm onSubmit={handleSubmit(onSubmit)}>
          <HStack>
            <Separator color="var(--grey-800)" flex="1" size="md" />
            <Text variant="caption" color="var(--grey-500)">
              또는
            </Text>
            <Separator color="var(--grey-800)" flex="1" size="md" />
          </HStack>
          <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
            <Input
              type="email"
              placeholder="email@example.com"
              {...register("email")}
            />
          </InputAndTitle>

          <InputAndTitle
            title="비밀번호"
            errorMessage={errors.password?.message}
          >
            <PasswordInput placeholder="비밀번호" {...register("password")} />
            <ForgotPassword
              variant="small"
              weight="medium"
              color="var(--grey-500)"
              onClick={() => router.push("/forgot-password")}
            >
              비밀번호를 잊으셨나요?
            </ForgotPassword>
          </InputAndTitle>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button
            type="submit"
            disabled={isSubmitting || !email || !password}
            style={{ marginTop: "10px", fontWeight: "bold" }}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </Button>
        </LoginForm>
      </div>
      <DevTool control={control} />
      <div className="signup-link">
        계정이 없으신가요? <p onClick={() => router.push("/signup")}>회원가입</p>
      </div>
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

const LoginForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ErrorMessage = styled.p`
  color: #e11d48;
  font-size: 0.9rem;
  margin-top: 0.5rem;
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

const ForgotPassword = styled(Text)`
  width: fit-content;
  cursor: pointer;
  color: var(--grey-500);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
  & > p {
    color: var(--primary-700);
    font-weight: 700;
  }
`;
