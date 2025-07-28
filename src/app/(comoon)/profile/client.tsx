"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@chakra-ui/react";
import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { Field, Switch } from "@chakra-ui/react";
import Heading from "@/components/Text/Heading";
import InputAndTitle from "@/components/InputAndTitle";
import Button from "@/components/common/Button";
import { toaster } from "@/components/ui/toaster";
import FileUpload from "@/components/FileUpload";
import { redirect } from "next/navigation";
import { Separator } from "@chakra-ui/react";
import { getUserById } from "@/utils/data/user";
import { userLogout } from "@/utils/data/auth";
import { MdLockOpen } from "react-icons/md";
import { FaRegTrashAlt } from "react-icons/fa";
import { Modal } from "@/components/modal/Modal";
import Text from "@/components/Text/Text";
import { updateProfile, deleteUser, updatePassword } from "@/utils/data/user";
import { Loading } from "@/components/common/Loading";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import BackButton from "@/components/common/BackButton";



// 유효성 검증 스키마
const minLength = "이름은 1자 이상 입력해주세요.";
const maxLength = "이름은 10자 이하로 입력해주세요.";

const schema = z.object({
  first_name: z.string().min(1, minLength).max(10, maxLength),
  last_name: z.string().min(1, minLength).max(10, maxLength),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  profileImage: z.string().optional(),
  profileImageFileId: z.number().optional(),
  phone: z
    .string()
    .min(10, "전화번호는 10자 이상 입력해주세요.")
    .max(11, "전화번호는 11자 이하로 입력해주세요."),
  marketing_opt_in: z.boolean(),
});

type ProfileForm = z.infer<typeof schema>;

export default function ProfilePage() {
  const [opendModal, setOpendModal] = useState<"password" | "delete" | null>(
    null
  );
  const [password, setPassword] = useState("");
  const { isAuthenticated, loading, id, refreshToken } = useSupabaseAuth();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  if (!loading) {
    if (!isAuthenticated || !id) {
      toaster.create({
        title: "로그인 필요",
        description: "로그인 후 이용해주세요.",
        type: "error",
      });
      redirect("/login");
    }
  }

  // 폼 설정
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  // useEffect를 사용하여 컴포넌트 마운트 후 프로필 데이터 가져오기
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated) {
        try {
          setIsLoadingProfile(true);
          const data = await getUserById(id || "");
          setValue("profileImage", data.profile_image || "");
          setValue("profileImageFileId", data.profile_image_file_id || undefined);
          setValue("first_name", data.first_name || "");
          setValue("last_name", data.last_name || "");
          setValue("email", data.email || "");
          setValue("phone", data.phone || "");
          setValue("marketing_opt_in", data.marketing_opt_in || false);
        } catch (error) {
          console.error("프로필 데이터 로딩 중 오류:", error);
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    fetchProfile();
  }, [isAuthenticated, setValue, id]);

  // 폼 제출 처리
  const onSubmit = async (data: ProfileForm) => {
    if (!id) return;

    try {
      const { error } = await updateProfile(id, {
        first_name: data.first_name,
        last_name: data.last_name,
        profile_image: data.profileImage,
        profile_image_file_id: data.profileImageFileId,
        phone: data.phone,
        marketing_opt_in: data.marketing_opt_in,
      });

      if (error) throw error;

      // 유저 정보 새로고침
      await refreshToken();

      toaster.create({
        title: "프로필 업데이트 성공",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
        type: "success",
      });
    } catch (error) {
      console.error("프로필 업데이트 중 오류:", error);
      toaster.create({
        title: "업데이트 실패",
        description: "프로필 정보 업데이트에 실패했습니다.",
        type: "error",
      });
    }
  };

  // 로딩 상태 표시 (인증 로딩 또는 프로필 로딩 중)
  if (loading || isLoadingProfile) {
    return <Loading />;
  }

  const handleDelete = async () => {
    const { error } = await deleteUser(id || "");
    if (error) throw error;
    await userLogout();
    toaster.create({
      title: "회원 탈퇴 성공",
      description: "회원 탈퇴가 성공적으로 완료되었습니다.",
      type: "success",
    });
    redirect("/login");
    setOpendModal(null);
  };

  const handlePasswordReset = async (data: string) => {
    try {
      const { error } = await updatePassword(data);
      if (error) throw error;
      
      // 모달 먼저 닫기
      setOpendModal(null);
      
      // 토스트 메시지 표시
      toaster.create({
        title: "비밀번호 업데이트 성공",
        description: "비밀번호가 성공적으로 업데이트되었습니다.",
      });
      
      // 비동기로 상태 갱신
      setTimeout(() => {
        refreshToken();
      }, 100);
    } catch (error) {
      console.error("비밀번호 업데이트 실패:", error);
      toaster.create({
        title: "비밀번호 업데이트 실패",
        description: "비밀번호 업데이트 중 오류가 발생했습니다.",
        type: "error",
      });
    }
  };
  return (
    <Container>
      <div className="page-header">
        <BackButton />
      </div>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="horizontal-container">
          <Heading level={4}>사용자 정보</Heading>
          <Button
            variant="outline"
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            style={{ maxWidth: "100px" }}
          >
            저장
          </Button>
        </div>
        <InputAndTitle title="프로필 이미지">
          <FileUpload
            placeholder="프로필 이미지를 업로드하세요"
            width="100px"
            height="100px"
            initialFileUrl={getValues("profileImage") || ""}
            initialFileId={getValues("profileImageFileId")}
            acceptedFileTypes={{ "image/*": [".jpeg", ".jpg", ".png", ".webp"] }}
            maxFiles={1}
            multiple={false}
            onUploadComplete={async (fileUrl, fileId) => {
              setValue("profileImage", fileUrl);
              if (fileId) {
                setValue("profileImageFileId", fileId);
              }
            }}
          />
        </InputAndTitle>
        <div className="horizontal-container">
          <InputAndTitle title="이름" errorMessage={errors.first_name?.message}>
            <Input type="text" {...register("first_name")} />
          </InputAndTitle>
          <InputAndTitle title="성" errorMessage={errors.last_name?.message}>
            <Input type="text" {...register("last_name")} />
          </InputAndTitle>
        </div>
        <InputAndTitle title="전화번호" errorMessage={errors.phone?.message}>
          <Input type="text" {...register("phone")} />
        </InputAndTitle>
        <InputAndTitle
          title="알림 수신"
          errorMessage={errors.marketing_opt_in?.message}
        >
          <Controller
            name="marketing_opt_in"
            control={control}
            render={({ field }) => (
              <Field.Root invalid={!!errors.marketing_opt_in}>
                <Switch.Root
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={({ checked }) => field.onChange(checked)}
                >
                  <Switch.HiddenInput onBlur={field.onBlur} />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Field.Root>
            )}
          />
        </InputAndTitle>
        <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
          <Input
            type="email"
            {...register("email")}
            disabled // 이메일은 수정 불가능하게 설정
          />
        </InputAndTitle>
      </Form>
      <Separator size="lg" />
      <Heading level={4}>보안</Heading>
      <div className="button-container">
        <div className="menu-item" onClick={() => setOpendModal("password")}>
          <MdLockOpen />
          비밀번호 초기화
        </div>
        <div className="menu-item" onClick={() => setOpendModal("delete")}>
          <FaRegTrashAlt />
          회원 탈퇴
        </div>
      </div>
      <Modal
        isOpen={opendModal === "password"}
        onClose={() => setOpendModal(null)}
      >
        <ModalContainer>
          <Heading level={4}>비밀번호 초기화</Heading>
          <InputAndTitle
            title="변경할 비밀번호"
            errorMessage={
              password.length < 6 ? "비밀번호는 6자 이상 입력해주세요." : ""
            }
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </InputAndTitle>
          <Button
            variant="outline"
            type="submit"
            onClick={() => handlePasswordReset(password)}
          >
            초기화
          </Button>
        </ModalContainer>
      </Modal>
      <Modal
        isOpen={opendModal === "delete"}
        onClose={() => setOpendModal(null)}
      >
        <ModalContainer>
          <Heading level={3}>회원 탈퇴</Heading>
          <div className="modal-text">
            <Text variant="body" color="var(--negative-500)" fontWeight="bold">
              이 작업은 돌이킬 수 없습니다. 회원 탈퇴 시 모든 데이터가
              삭제됩니다.
            </Text>
          </div>
          <Button variant="outline" type="submit" onClick={handleDelete}>
            탈퇴
          </Button>
        </ModalContainer>
      </Modal>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;

  .page-header {
    padding: 16px;
    border-bottom: 1px solid var(--grey-200);
    
    @media (max-width: 768px) {
      padding: 12px;
    }
  }

  .modal-text {
    text-align: center;
    padding: 2rem;
  }

  .container-modal {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    justify-content: center;
  }

  .horizontal-container {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }

  .button-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .menu-item {
    display: flex;
    gap: 8px;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;

    &:hover {
      background-color: var(--grey-200);
    }
  }
`;

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  justify-content: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
