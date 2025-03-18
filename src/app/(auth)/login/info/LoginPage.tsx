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
import { DevTool } from "@hookform/devtools";
import { useState } from "react";
import Cookies from "js-cookie";
import { decrypt } from "@/utils/encryption";
import { NeededUserMetadata } from "@/app/(auth)/auth/callback/route";
import { createProfile } from "../../actions";
import { useOrganization } from "@/hooks/useOrganization";
import Select from "react-select";
import { Modal } from "@/components/modal/Modal";
import { confirmRoleAccessCode } from "../../actions";
import { toaster } from "@/components/ui/toaster";

type Agreement = "mailAgreement" | "cookieAgreement";

export default function LoginPage() {
  const router = useRouter();
  const [isChecked, setIsChecked] = useState<Agreement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleAccessCode, setRoleAccessCode] = useState("");
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
    setValue,
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
      marketing_opt_in: isChecked.includes("mailAgreement"),
      privacy_agreed: isChecked.includes("cookieAgreement"),
    },
  });
  const organizationOptions: { label: string; value: number }[] =
    organizations?.map((organization) => ({
      label: organization.name,
      value: organization.id,
    })) || [];
  const formatedKrRole = (role: Role) => {
    if (role === "admin") return "관리자";
    if (role === "teacher") return "교사";
    if (role === "user") return "학생";
  };

  const onSubmit = async (data: CreateUser) => {

    console.log(data);
    const { error } = await createProfile(data);
    if (error) {
      router.push(`/error?message=회원가입 실패: ${error.message}`);
      return;
    }
    router.push("/");
  };

  return (
    <Container onSubmit={handleSubmit(onSubmit)}>
      <FormContainer>
        <Heading level={4}>
          환영합니다! {decryptedAuthData?.first_name}님
        </Heading>
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
                setValue("organization_id", e?.value || null);
                console.log(e?.value);
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
        <DevTool control={control} />
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
              const { data, error } = await confirmRoleAccessCode(
                roleAccessCode,
                roleAccessType.value as Role
              );
              console.log("data", data, "error", error);
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
                setValue("role", data.role as Role);
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
