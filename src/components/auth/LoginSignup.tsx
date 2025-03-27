"use client";

import { useForm } from "react-hook-form";
import { Spinner } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { z } from "zod";
import InputAndTitle from "@/components/InputAndTitle";
import { PasswordInput } from "@/components/ui/password-input";
import { signInWithEmail, signUpWithEmail } from "@/app/(auth)/actions";
import { Input } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import Button from "@/components/common/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DevTool } from "@hookform/devtools";
import Cookies from "js-cookie";
import { encrypt } from "@/utils/encryption";
import { createClient } from "@/utils/supabase/client";
import { NeededUserMetadata } from "@/app/(auth)/auth/callback/route";
import { useAuthStore } from "@/store/auth";
let decryptedAuthData: NeededUserMetadata = {
  uid: "",
  email: "",
  first_name: "",
  last_name: "",
  profile_image: "",
  isEmailSignup: false,
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginSignup({ type }: { type: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();
  const { refreshUser } = useAuthStore();
  const email = watch("email");
  const password = watch("password");

  const onSubmitLogin = async (data: LoginFormData) => {

    const { userData ,error } = await signInWithEmail(data.email, data.password);
    if (error) {
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
      return;
    }
    const supabase = createClient();
    const { data: user } = await supabase.from('profiles').select('*').eq('email', userData.user?.email || '').single();
    if (!user) {
      router.push("/login/info");
      return;
    }
    refreshUser();
    router.push("/");
    return;
  };
  const onSubmitSignup = async (data: LoginFormData) => {
    const { userData: { user }, error } = await signUpWithEmail(data.email, data.password);
    const supabase = createClient();
    const { data: duplicateUser } = await supabase.from('profiles').select('*').eq('email', data.email)
    if (duplicateUser && duplicateUser.length > 0) {
      setError("이미 가입된 이메일입니다.");
      return;
    }
    if (error) {
      setError("회원가입에 실패했습니다. 비밀번호는 최소 6자리 이상 입니다.");
      return;
    }
    decryptedAuthData = {
      uid: user?.id || "",
      email: user?.email || "",
      first_name: user?.user_metadata.first_name || "",
      last_name: user?.user_metadata.last_name || "",
      profile_image: user?.user_metadata.picture || "",
      isEmailSignup: true,
    }
    const encryptedAuthData = encrypt(JSON.stringify(decryptedAuthData));
    Cookies.set("auth_data", encryptedAuthData);
    router.push("/login/info");
  };
  return (
    <LoginForm
      onSubmit={
        type === "login"
          ? handleSubmit(onSubmitLogin)
          : handleSubmit(onSubmitSignup)
      }
    >
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
      <DevTool control={control} />
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
