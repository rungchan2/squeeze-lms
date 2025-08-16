"use client";

import { useForm } from "react-hook-form";
import { Spinner } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { z } from "zod";
import InputAndTitle from "@/components/InputAndTitle";
import { PasswordInput } from "@/components/ui/password-input";
import { signInWithEmail } from "@/app/(auth)/actions";
import { Input } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Button from "@/components/common/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";


const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginSignup() {
  const router = useRouter();
  const { refreshAuthState } = useSupabaseAuth();
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

  const onSubmitLogin = async (data: LoginFormData) => {
    const { userData, error } = await signInWithEmail(
      data.email,
      data.password
    );
    if (error) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
      console.log("error", error);
      return;
    }
    const supabase = createClient();
    const { data: user } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userData.user?.email || "")
      .single();
    if (!user) {
      router.push("/login/info");
      return;
    }
    refreshAuthState();
    router.push("/");
    return;
  };
  return (
    <LoginForm onSubmit={handleSubmit(onSubmitLogin)}>
      <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
        <Input
          type="email"
          placeholder="email@example.com"
          {...register("email")}
          autoComplete="username"
        />
      </InputAndTitle>

      <InputAndTitle title="비밀번호" errorMessage={errors.password?.message}>
        <PasswordInput
          placeholder="비밀번호"
          {...register("password")}
          autoComplete="current-password"
        />
        <ForgotPassword
          variant="small"
          weight="medium"
          color="var(--grey-500)"
          onClick={() => router.push("/forgot-password")}
        >
          비밀번호를 잊으셨나요?
        </ForgotPassword>
      </InputAndTitle>

      {error && (
        <Text
          variant="caption"
          color="var(--negative-500)"
          style={{ textAlign: "center" }}
        >
          {error}
        </Text>
      )}

      <Button
        variant="flat"
        type="submit"
        disabled={isSubmitting || !email || !password}
        style={{ marginTop: "10px", fontWeight: "bold" }}
      >
        {isSubmitting ? <Spinner /> : "로그인"}
      </Button>
      {/* <DevTool control={control} /> */}
    </LoginForm>
  );
}

const LoginForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
