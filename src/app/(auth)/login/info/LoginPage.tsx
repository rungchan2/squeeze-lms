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
import Cookies from "js-cookie";
import { decrypt } from "@/utils/encryption";
import { NeededUserMetadata } from "@/app/(auth)/auth/callback/route";
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
    control,
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
      marketing_opt_in: false,
      privacy_agreed: false,
    },
  });

  // 사용자 데이터 로드
  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      if (!isMounted) return;

      try {
        // 서버에서 사용자 확인
        const userData = await getUser();
        if (!userData && isMounted) {
          router.push("/error?message=로그인 정보가 없거나 유효하지 않습니다");
          return;
        }

        // 쿠키에서 인증 데이터 가져오기
        const cookieAuthData = Cookies.get("auth_data");
        if (!cookieAuthData || typeof cookieAuthData !== "string") {
          if (isMounted) {
            router.push(
              "/error?message=로그인 정보가 없거나 유효하지 않습니다"
            );
          }
          return;
        }

        try {
          const decryptedString = decrypt(cookieAuthData);
          if (!decryptedString) {
            throw new Error("복호화된 데이터가 없습니다");
          }

          const decryptedAuthData: NeededUserMetadata =
            JSON.parse(decryptedString);

          if (isMounted) {
            setAuthData(decryptedAuthData);

            // 폼 값 설정
            setValue("email", decryptedAuthData.email || "");
            setValue("first_name", decryptedAuthData.first_name || "");
            setValue("last_name", decryptedAuthData.last_name || "");
            setValue("profile_image", decryptedAuthData.profile_image || "");

            if (decryptedAuthData.isEmailSignup) {
              setIsSignUpUseEmail(true);
            }

            setIsLoading(false);
          }
        } catch (error) {
          if (isMounted) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "알 수 없는 에러가 발생했습니다";
            router.push(`/error?message=${encodeURIComponent(errorMessage)}`);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("사용자 정보 확인 중 오류:", error);
          router.push(
            "/error?message=로그인 정보를 확인하는 중 오류가 발생했습니다"
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
    // 체크박스 상태가 변경될 때 폼 값 업데이트
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

  const organizationOptions: { label: string; value: string }[] =
    organizations?.map((organization) => ({
      label: organization.name,
      value: organization.id,
    })) || [];

  

  const onSubmit = async (data: CreateUser) => {
    try {
      const { error } = await createProfile(data);
      if (error) {
        router.push(`/error?message=회원가입 실패: ${error.message}`);
        return;
      }

      if (isSignUpUseEmail) {
        toaster.create({
          title: "회원가입 성공. 이메일 로그인 후 이용해주세요.",
          type: "success",
        });
        window.location.href = "/login";
        return;
      }

      try {
        // 프로필 생성 성공 후 홈페이지로 리다이렉트
        window.location.href = "/";
      } catch (refreshError) {
        console.error("사용자 정보 갱신 중 오류:", refreshError);
        toaster.create({
          title: "회원가입은 성공했으나 로그인 처리 중 오류가 발생했습니다.",
          type: "warning",
        });
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      router.push("/error?message=회원가입 중 오류가 발생했습니다");
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
              } else if (accessCodeData) {
                setConfirmedRoleType(accessCodeData.role as Role);
                setValue("role", accessCodeData.role as Role);
                toaster.create({
                  title: "권한 인증 성공",
                  type: "success",
                });
                setValue("role", accessCodeData.role as Role);
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
