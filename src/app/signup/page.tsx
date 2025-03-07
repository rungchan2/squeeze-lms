"use client";

import styled from "@emotion/styled";
import InputAndTitle from "@/components/InputAndTitle";
import Heading from "@/components/Text/Heading";
import { Input } from "@chakra-ui/react";
import Button from "@/components/common/Button";
import { PasswordInput } from "@/components/ui/password-input";
import Text from "@/components/Text/Text";
import Checkbox from "@/components/common/Checkbox";
import { Separator, Stack, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type Signup } from "@/types/users";
import { DevTool } from "@hookform/devtools";
import { useState } from "react";
import { signUpWithEmail } from "@/utils/socialLogin";
import { clearCookie } from "@/utils/socialLogin";
type Agreement = "mailAgreement" | "cookieAgreement";

export default function LoginInfoPage() {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState<Agreement[]>([]);
  const handleCheckboxChangeAll = () => {
    if (isChecked.length === 2) {
      setIsChecked([]);
    } else {
      setIsChecked(["mailAgreement", "cookieAgreement"]);
    }
  };
  const handleCheckboxChange = (value: Agreement) => {
    if (isChecked.includes(value)) {
      setIsChecked(isChecked.filter((item) => item !== value));
    } else {
      setIsChecked([...isChecked, value]);
    }
  };
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<Omit<Signup, "uid">>({
    resolver: zodResolver(signupSchema.omit({ uid: true })),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      name: "",
      lastName: "",
      phone: "",
      mailAgreement: false,
      cookieAgreement: false,
    },
  });
  
  console.log("Form State:", {
    errors,
    isValid,
    isSubmitting,
    values: watch(),
  });

  const onSubmit = async (data: Omit<Signup, "uid">) => {
    const { userData: signUpData, error: signUpError } = await signUpWithEmail(data.email, data.password);
    if (signUpError) {
      router.push(`/error?message=회원가입 실패: ${signUpError}`);
      return;
    }
    const { error : userError } = await supabase.from("users").insert({
      uid: signUpData.user?.id,
      email: data.email,
      name: data.name,
      lastName: data.lastName,
      phone: data.phone,
      role: "user",
      mailAgreement: isChecked.includes("mailAgreement"),
      cookieAgreement: isChecked.includes("cookieAgreement"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (userError) {
      router.push(`/error?message=회원가입 실패: ${userError}`);
      return;
    }
    router.push("/");
    clearCookie();
  };

  return (
    <Container onSubmit={handleSubmit(onSubmit)}>
      <Heading level={3}>회원가입</Heading>
      <InputContainer>
        <HorizontalContainer>
          <InputAndTitle title="성" errorMessage={errors.lastName?.message}>
            <Input type="text" placeholder="홍" {...register("lastName")} />
          </InputAndTitle>
          <InputAndTitle title="이름" errorMessage={errors.name?.message}>
            <Input type="text" placeholder="길동" {...register("name")} />
          </InputAndTitle>
        </HorizontalContainer>
        <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
          <Input
            type="email"
            placeholder="example@gmail.com"
            {...register("email")}
          />
        </InputAndTitle>
        <InputAndTitle title="전화번호" errorMessage={errors.phone?.message}>
          <Input
            type="tel"
            placeholder="010-1234-5678"
            {...register("phone")}
          />
        </InputAndTitle>
        <InputAndTitle title="비밀번호" errorMessage={errors.password?.message}>
          <PasswordInput
            placeholder="비밀번호를 입력해주세요"
            {...register("password")}
          />
        </InputAndTitle>
        <InputAndTitle
          title="비밀번호 확인"
          errorMessage={
            errors.passwordConfirm?.message ||
            watch("password") !== watch("passwordConfirm")
              ? "비밀번호가 일치하지 않습니다"
              : undefined
          }
        >
          <PasswordInput
            placeholder="비밀번호를 입력해주세요"
            {...register("passwordConfirm")}
          />
        </InputAndTitle>
      </InputContainer>
      <Stack className="agreement-container">
        <div className="agreement-container-line">
          <Text variant="caption" weight="bold">
            개인정보 보호정책 및 메일 수신에 동의합니다
          </Text>
          <Checkbox
            checked={
              isChecked.includes("mailAgreement") &&
              isChecked.includes("cookieAgreement")
            }
            onChange={handleCheckboxChangeAll}
          />
        </div>
        <Separator orientation="horizontal" style={{ width: "100%" }} />
        <div className="agreement-container-line">
          <Text variant="small" weight="medium">
            메일 수신 동의하기(선택)
          </Text>
          <Checkbox
            checked={isChecked.includes("mailAgreement")}
            onChange={() => handleCheckboxChange("mailAgreement")}
          />
        </div>
        <div className="agreement-container-line">
          <Text variant="small" weight="medium">
            개인정보 보호정책 및 쿠키 사용에 동의합니다(필수)
          </Text>
          <Checkbox
            checked={isChecked.includes("cookieAgreement")}
            onChange={() => handleCheckboxChange("cookieAgreement")}
          />
        </div>
      </Stack>
      <Button 
        variant="flat"
        type="submit" 
        disabled={isSubmitting || !isChecked.includes("cookieAgreement")}
      >
        {isSubmitting ? <Spinner /> : "회원가입"}
      </Button>
      <DevTool control={control} />
    </Container>
  );
}

const Container = styled.form`  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 40px 16px;

  .agreement-container {
    margin: 16px 0;
    display: flex;
    align-items: center;
    gap: 3px;
    flex-direction: column;
    background-color: var(--white);
    padding: 10px;
    border-radius: 6px;
    width: 100%;
    .agreement-container-line {
      width: 100%;
      justify-content: space-between;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-direction: row;
    }
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  input {
    background-color: var(--white);
  }
  .password-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
`;

const HorizontalContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 10px;
  flex-direction: row;
  align-items: top;
  justify-content: top;
`;

