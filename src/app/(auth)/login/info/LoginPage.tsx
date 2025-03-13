"use client";

import styled from "@emotion/styled";
import InputAndTitle from "@/components/InputAndTitle";
import Heading from "@/components/Text/Heading";
import { Input } from "@chakra-ui/react";
import Button from "@/components/common/Button";
import Text from "@/components/Text/Text";
import Checkbox from "@/components/common/Checkbox";
import { Separator, Stack, Spinner } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUser } from "@/types/users";
import { DevTool } from "@hookform/devtools";
import { useState } from "react";
import Cookies from "js-cookie";
import { decrypt } from "@/utils/encryption";
import { NeededUserMetadata } from "@/app/(auth)/auth/callback/route";
import { createProfile } from "../../actions";

type Agreement = "mailAgreement" | "cookieAgreement";


export default function LoginPage() {

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
  function getDecryptedAuthData() {
    const authData = Cookies.get("auth_data");

    if (!authData || typeof authData !== "string") {
      console.log("유효하지 않은 auth_data");
      router.push("/error?message=로그인 정보가 없거나 유효하지 않습니다");
      return;
    }

    try {
      const decryptedString = decrypt(authData);
      if (!decryptedString) {
        throw new Error("복호화된 데이터가 없습니다");
      }
      const decryptedAuthData: NeededUserMetadata = JSON.parse(decryptedString);
      return decryptedAuthData;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 에러가 발생했습니다";
      window.location.href = `/error?message=${encodeURIComponent(
        errorMessage
      )}`;
    }
  }
  const decryptedAuthData = getDecryptedAuthData();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUser>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange",
    defaultValues: {
      email: decryptedAuthData?.email || "",
      first_name: decryptedAuthData?.first_name || "",
      last_name: decryptedAuthData?.last_name || "",
      phone: "",
      uid: decryptedAuthData?.uid || "",
      profile_image: decryptedAuthData?.profile_image || "",
      organization_id: null,
      marketing_opt_in: isChecked.includes("mailAgreement"),
      privacy_agreed: isChecked.includes("cookieAgreement"),
    },
  });
  console.log(errors);

  const onSubmit = async (data: CreateUser) => {
    console.log(data);
    const { data: userData, error } = await createProfile(data);
    if (error) {
      router.push(`/error?message=회원가입 실패: ${error.message}`);
      return;
    }
    router.push("/");
  };

  return (
    <Container onSubmit={handleSubmit(onSubmit)}>
      <Heading level={4}>환영합니다! {decryptedAuthData?.first_name}님</Heading>
      <InputContainer>
        <HorizontalContainer>
          <InputAndTitle title="성" errorMessage={errors.last_name?.message}>
            <Input type="text" placeholder="홍" {...register("last_name")} />
          </InputAndTitle>
          <InputAndTitle title="이름" errorMessage={errors.first_name?.message}>
            <Input type="text" placeholder="길동" {...register("first_name")} />
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
        {isSubmitting ? (
          <>
            <Spinner /> 회원가입
          </>
        ) : (
          "회원가입"
        )}
      </Button>
      <DevTool control={control} />
    </Container>
  );
}

const Container = styled.form`
  display: flex;
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
