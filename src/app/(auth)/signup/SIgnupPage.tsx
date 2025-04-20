"use client";

import styled from "@emotion/styled";
import InputAndTitle from "@/components/InputAndTitle";
import Heading from "@/components/Text/Heading";
import { Input } from "@chakra-ui/react";
import Button from "@/components/common/Button";
import Text from "@/components/Text/Text";
import Checkbox from "@/components/common/Checkbox";
import {
  Separator,
  Stack,
  Spinner,
  RadioGroup,
  HStack,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DevTool } from "@hookform/devtools";
import { useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import Select from "react-select";
import { toaster } from "@/components/ui/toaster";
import constants from "@/utils/constants";
import { createProfile } from "@/utils/data/user";
import { signupPageSchema, type SignupPage } from "@/types";
import { signUpWithEmail } from "@/utils/data/auth";
import { Modal } from "@/components/modal/Modal";
import { Role } from "@/types";
import { accessCode } from "@/utils/data/accessCode";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type Agreement = "mailAgreement" | "cookieAgreement";

export default function SignupPage() {
  const [isChecked, setIsChecked] = useState<Agreement[]>([]);
  const [roleAccessCode, setRoleAccessCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleAccessType, setRoleAccessType] = useState<string>("teacher");
  const [confirmedRoleType, setConfirmedRoleType] = useState<Role | null>(null);
  const { refreshToken } = useSupabaseAuth();
  const roleAccessTypeOptions = [
    { label: "관리자", value: "admin" },
    { label: "교사", value: "teacher" },
  ];
  const {
    data: { useOrganizationList },
  } = useOrganization();
  const { organizations, isLoading: isOrganizationLoading } =
    useOrganizationList();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupPage>({
    resolver: zodResolver(signupPageSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "user",
      marketing_opt_in: false,
      privacy_agreed: false,
      profile_image: "",
    },
  });

  // 필수 필드 감시
  const email = watch("email");
  const password = watch("password");
  const password_confirmation = watch("password_confirmation");
  const first_name = watch("first_name");
  const last_name = watch("last_name");
  const phone = watch("phone");
  const organization_id = watch("organization_id");

  // 모든 필수 필드가 입력되었는지 확인
  const allRequiredFieldsFilled =
    !!email &&
    !!password &&
    !!password_confirmation &&
    !!first_name &&
    !!last_name &&
    !!phone &&
    !!organization_id &&
    watch("password") === watch("password_confirmation");

  useEffect(() => {
    setValue("marketing_opt_in", isChecked.includes("mailAgreement"));
    setValue("privacy_agreed", isChecked.includes("cookieAgreement"));
  }, [isChecked, setValue]);

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

  const organizationOptions =
    organizations?.map((organization) => ({
      label: organization.name,
      value: organization.id,
    })) || [];

  const onSubmit = async (data: SignupPage) => {
    try {
      // 1. 인증 계정 생성
      const { userData, error } = await signUpWithEmail(
        data.email,
        data.password
      );

      if (error) {
        console.error("회원가입 오류:", error);
        toaster.create({
          title: `회원가입 실패: ${error.message}`,
          type: "error",
        });
        return;
      }

      // 2. 프로필 생성
      if (userData.user) {
        // 사용자 ID 가져오기

        // 프로필 데이터에 uid 추가
        const profileData: SignupPage = {
          ...data,
          profile_image: "",
        };

        // 프로필 생성
        const { error: profileError } = await createProfile(profileData);

        if (profileError) {
          console.error("프로필 생성 오류:", profileError);
          toaster.create({
            title: `프로필 생성 실패: ${profileError.message}`,
            type: "error",
          });
          return;
        }

        toaster.create({
          title: "회원가입이 완료되었습니다.",
          type: "success",
        });
        console.log("회원가입 완료");
        await refreshToken();
        
        // 인증 상태가 업데이트될 시간을 주기 위해 짧은 지연 후 리다이렉트
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      } else {
        console.error("사용자 정보 없음");
        toaster.create({
          title: "사용자 정보를 찾을 수 없습니다.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      toaster.create({
        title: "회원가입 중 오류가 발생했습니다",
        type: "error",
      });
    }
  };

  return (
    <Container>
      <FormContainer onSubmit={handleSubmit(onSubmit)}>
        <Heading level={4}>환영합니다!</Heading>

        <InputContainer>
          <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
            <Input
              type="email"
              placeholder="example@gmail.com"
              {...register("email")}
              autoComplete="email"
            />
          </InputAndTitle>

          <InputAndTitle
            title="비밀번호"
            errorMessage={errors.password?.message}
          >
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              {...register("password")}
              autoComplete="new-password"
            />
          </InputAndTitle>

          <InputAndTitle
            title="비밀번호 확인"
            errorMessage={
              errors.password_confirmation?.message ||
              watch("password") !== watch("password_confirmation")
                ? "비밀번호가 일치하지 않습니다."
                : ""
            }
          >
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              {...register("password_confirmation")}
              autoComplete="new-password"
            />
          </InputAndTitle>

          <HorizontalContainer>
            <InputAndTitle title="성" errorMessage={errors.last_name?.message}>
              <Input
                type="text"
                placeholder="홍"
                {...register("last_name")}
                autoComplete="family-name"
              />
            </InputAndTitle>

            <InputAndTitle
              title="이름"
              errorMessage={errors.first_name?.message}
            >
              <Input
                type="text"
                placeholder="길동"
                {...register("first_name")}
                autoComplete="given-name"
              />
            </InputAndTitle>
          </HorizontalContainer>

          <InputAndTitle title="전화번호" errorMessage={errors.phone?.message}>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              {...register("phone")}
              autoComplete="tel"
            />
          </InputAndTitle>

          <InputAndTitle
            title="나의 소속"
            errorMessage={errors.organization_id?.message}
          >
            <Select
              placeholder="소속을 선택해주세요"
              className="basic-single"
              classNamePrefix="select"
              isDisabled={isOrganizationLoading}
              isLoading={isOrganizationLoading}
              isClearable={true}
              isSearchable={true}
              options={organizationOptions}
              name="organization_id"
              styles={{
                control: (base) => ({
                  ...base,
                  border: "1px solid var(--grey-300)",
                }),
              }}
              onChange={(e) => {
                setValue("organization_id", e?.value || "");
              }}
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
              <a
                href={constants.PRIVACY_POLICY_URL || ""}
                target="_blank"
                rel="noopener noreferrer"
              >
                개인정보 보호정책 및 쿠키 사용에 동의합니다(필수)
              </a>
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
          disabled={
            isSubmitting ||
            !isChecked.includes("cookieAgreement") ||
            !allRequiredFieldsFilled ||
            Object.keys(errors).length > 0
          }
        >
          {isSubmitting ? (
            <>
              <Spinner /> 회원가입 중...
            </>
          ) : confirmedRoleType === "admin" ? (
            "관리자 회원가입"
          ) : confirmedRoleType === "teacher" ? (
            "교사 회원가입"
          ) : (
            "회원가입"
          )}
        </Button>
        <Text
          variant="caption"
          weight="medium"
          onClick={() => setIsModalOpen(true)}
          color="var(--grey-500)"
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            marginTop: "10px",
          }}
        >
          다른 권한으로 회원가입하기
        </Text>
        {process.env.NODE_ENV === "development" && (
          <DevTool control={control} />
        )}
      </FormContainer>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContainer>
          <Heading level={4}>다른 권한으로 회원가입하기</Heading>
          <InputAndTitle title="권한 종류">
            <RadioGroup.Root
              value={roleAccessType}
              onValueChange={(e) => setRoleAccessType(e.value)}
            >
              <HStack gap="6">
                {roleAccessTypeOptions.map((item) => (
                  <RadioGroup.Item key={item.value} value={item.value}>
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
                  </RadioGroup.Item>
                ))}
              </HStack>
            </RadioGroup.Root>
          </InputAndTitle>
          <InputAndTitle title="권한 코드">
            <Input
              type="text"
              placeholder="권한 코드"
              value={roleAccessCode}
              onChange={(e) => setRoleAccessCode(e.target.value)}
            />
          </InputAndTitle>
          <Button
            style={{ marginTop: "16px" }}
            variant="flat"
            disabled={!roleAccessCode}
            onClick={async () => {
              const { data, error } = await accessCode.confirmAccessCode(
                roleAccessCode,
                roleAccessType as Role
              );
              if (error || !data) {
                toaster.create({
                  title: "권한 인증 실패",
                  type: "error",
                });
              } else if (data) {
                setConfirmedRoleType(data.role as Role);
                setValue("role", data.role as Role);
                toaster.create({
                  title: "권한 인증 성공",
                  type: "success",
                });
                setIsModalOpen(false);
                setRoleAccessCode("");
              }
            }}
          >
            인증
          </Button>
        </ModalContainer>
      </Modal>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 80px;
  height: calc(100vh - 90px);
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
  max-width: 500px;
  padding: 12px;
  background-color: var(--white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .agreement-container {
    margin: 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-direction: column;
    background-color: var(--grey-50);
    padding: 16px;
    border-radius: 6px;
    width: 100%;

    .agreement-container-line {
      width: 100%;
      justify-content: space-between;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-direction: row;

      a {
        &:hover {
          text-decoration: underline;
          color: var(--grey-500);
        }
      }
    }
  }
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;

  input {
    background-color: var(--white);
  }
`;

const HorizontalContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 12px;
  flex-direction: row;
  align-items: flex-start;
`;
const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;
