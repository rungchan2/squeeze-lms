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
import { createUserSchema, Role, type CreateUser } from "@/types";
import { useState, useEffect } from "react";
import { NeededUserMetadata } from "@/app/(auth)/auth/callback/route";
import { getAuthDataFromCookie, clearAuthCookie } from "@/app/(auth)/actions/auth-data";
import { createProfile } from "../../actions";
import { useOrganization } from "@/hooks/useOrganization";
import Select from "react-select";
import { Modal } from "@/components/modal/Modal";
import { accessCode } from "@/utils/data/accessCode";
import { getUser } from "@/utils/data/auth";
import { toaster } from "@/components/ui/toaster";
import constants from "@/utils/constants";

type Agreement = "mailAgreement" | "cookieAgreement";

export const formatedKrRole = (role: Role) => {
  if (role === "admin") return "관리자";
  if (role === "teacher") return "교사";
  if (role === "user") return "학생";
};

export default function LoginPage() {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState<Agreement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleAccessCode, setRoleAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [authData, setAuthData] = useState<NeededUserMetadata | null>(null);
  const [isSignUpUseEmail, setIsSignUpUseEmail] = useState(false);
  const [roleAccessType, setRoleAccessType] = useState<{
    label: string;
    value: Omit<Role, "user">;
  }>({ label: "교사", value: "teacher" });
  const [confirmedRoleType, setConfirmedRoleType] = useState<Role | null>(null);
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUser>({
    resolver: zodResolver(createUserSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "user",
      profile_image: "",
      profile_image_file_id: null,
      organization_id: "",
      marketing_opt_in: false,
      privacy_agreed: true, // Must be true to match the schema
    },
  });

  // Load user data
  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      if (!isMounted) return;

      try {
        // Verify user is authenticated
        const { data: userData, error: userError } = await getUser();
        if (userError || !userData?.user) {
          if (isMounted) {
            console.error("User verification failed:", userError);
            router.push("/error?message="+encodeURIComponent("로그인 정보가 없거나 유효하지 않습니다"));
          }
          return;
        }

        // Get auth data from cookie (server-side)
        const { data: authData, error: authError } = await getAuthDataFromCookie();
        
        if (authError || !authData) {
          if (isMounted) {
            console.error("Auth data error:", authError);
            router.push("/error?message="+encodeURIComponent(authError || "로그인 정보를 확인할 수 없습니다"));
          }
          return;
        }

        if (isMounted) {
          setAuthData(authData);

          // Set form values
          setValue("email", authData.email || "");
          setValue("first_name", authData.first_name || "");
          setValue("last_name", authData.last_name || "");
          setValue("profile_image", authData.profile_image || "");

          if (authData.isEmailSignup) {
            setIsSignUpUseEmail(true);
          }

          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("사용자 정보 확인 중 오류:", error);
          router.push(
            "/error?message="+encodeURIComponent("로그인 정보를 확인하는 중 오류가 발생했습니다")
          );
        }
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [router, setValue]);

  useEffect(() => {
    // Update form values when checkbox state changes
    setValue("marketing_opt_in", isChecked.includes("mailAgreement"));
    // privacy_agreed must be true according to schema, only update if checked
    if (isChecked.includes("cookieAgreement")) {
      setValue("privacy_agreed", true);
    }
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

  const organizationOptions: { label: string; value: string }[] =
    organizations?.map((organization) => ({
      label: organization.name,
      value: organization.id,
    })) || [];

  

  const onSubmit = async (data: CreateUser) => {
    try {
      // Validate required fields
      if (!data.organization_id) {
        toaster.create({
          title: "소속을 선택해 주세요",
          type: "error",
        });
        return;
      }

      // Ensure phone number format
      if (data.phone && !data.phone.match(/^[0-9-]+$/)) {
        toaster.create({
          title: "전화번호는 숫자와 -만 입력 가능합니다",
          type: "error",
        });
        return;
      }

      const { error } = await createProfile(data);
      if (error) {
        console.error("Profile creation error:", error);
        
        // Handle specific error cases
        if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
          toaster.create({
            title: "이미 가입된 이메일입니다",
            type: "error",
          });
          router.push("/login");
          return;
        }
        
        router.push(`/error?message=${encodeURIComponent(`회원가입 실패: ${error.message}`)}`);
        return;
      }

      // Clear auth cookie after successful profile creation
      await clearAuthCookie();

      if (isSignUpUseEmail) {
        toaster.create({
          title: "회원가입 성공. 이메일 로그인 후 이용해주세요.",
          type: "success",
        });
        window.location.href = "/login";
        return;
      }

      // Redirect to home for OAuth users
      toaster.create({
        title: "회원가입이 완료되었습니다!",
        type: "success",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("회원가입 오류:", error);
      router.push("/error?message="+encodeURIComponent("회원가입 중 오류가 발생했습니다"));
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Spinner size="xl" />
        <Text variant="body" weight="medium" style={{ marginTop: "16px" }}>
          사용자 정보를 확인하는 중입니다...
        </Text>
      </Container>
    );
  }

  return (
    <Container onSubmit={handleSubmit(onSubmit)}>
      <FormContainer>
        <Heading level={4}>환영합니다! {authData?.first_name}님</Heading>
        <InputContainer>
          <HorizontalContainer>
            <InputAndTitle title="성" errorMessage={errors.last_name?.message}>
              <Input type="text" placeholder="홍" {...register("last_name")} />
            </InputAndTitle>
            <InputAndTitle
              title="이름"
              errorMessage={errors.first_name?.message}
            >
              <Input
                type="text"
                placeholder="길동"
                {...register("first_name")}
              />
            </InputAndTitle>
          </HorizontalContainer>
          <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
            <Input
              type="email"
              placeholder="example@gmail.com"
              {...register("email")}
              disabled
            />
          </InputAndTitle>
          <InputAndTitle title="전화번호" errorMessage={errors.phone?.message}>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              {...register("phone")}
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
              isRtl={false}
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
              <a
                href={constants.PRIVACY_POLICY_URL || ""}
                target="_blank"
                rel="noopener noreferrer"
              >
                개인정보 보호정책 및 메일 수신에 동의합니다
              </a>
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
          disabled={isSubmitting || !isChecked.includes("cookieAgreement")}
        >
          {isSubmitting ? (
            <>
              <Spinner /> 회원가입
            </>
          ) : confirmedRoleType ? (
            formatedKrRole(confirmedRoleType) + " 회원가입"
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
      </FormContainer>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContainer>
          <Heading level={4}>다른 권한으로 회원가입하기</Heading>
          <InputAndTitle title="권한 종류">
            <Select
              options={roleAccessTypeOptions}
              value={roleAccessType}
              onChange={(e) => e && setRoleAccessType(e)}
            />
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
              const { isValid, accessCode: accessCodeData, error } = await accessCode.confirmAccessCode(
                roleAccessCode,
                roleAccessType.value as Role
              );

              if (error || !isValid || !accessCodeData) {
                toaster.create({
                  title: "권한 인증 실패",
                  type: "error",
                });
              } else if (accessCodeData && 'role' in accessCodeData) {
                setConfirmedRoleType(accessCodeData.role as Role);
                setValue("role", accessCodeData.role as Role);
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

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const FormContainer = styled.form`
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
