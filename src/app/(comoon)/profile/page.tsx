"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@chakra-ui/react";
import styled from "@emotion/styled";

import { useAuth } from "@/components/AuthProvider"; // 수정된 인증 컨텍스트 사용
import { createClient } from "@/utils/supabase/client";
import Heading from "@/components/Text/Heading";
import Spinner from "@/components/common/Spinner";
import InputAndTitle from "@/components/InputAndTitle";
import Button from "@/components/common/Button";
import { toaster } from "@/components/ui/toaster";
import FileUpload from "@/components/common/FileUpload";
import { redirect } from "next/navigation";
// 유효성 검증 스키마
const minLength = "이름은 1자 이상 입력해주세요.";
const maxLength = "이름은 10자 이하로 입력해주세요.";

const schema = z.object({
  first_name: z.string().min(1, minLength).max(10, maxLength),
  last_name: z.string().min(1, minLength).max(10, maxLength),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  profileImage: z.string().optional(),
});

type ProfileForm = z.infer<typeof schema>;

export default function ProfilePage() {
  // useAuth 훅 사용
  const {
    isAuthenticated,
    loading,
    uid,
    refreshUser,
    profileImage,
    email,
    fullName,
  } = useAuth();

  if (!isAuthenticated) {
    redirect("/login");
  }

  // 폼 설정
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      email: email || "",
      first_name: fullName?.split(" ")[0] || "",
      last_name: fullName?.split(" ")[1] || "",
      profileImage: profileImage || "",
    },
  });

  // 폼 제출 처리
  const onSubmit = async (data: ProfileForm) => {
    if (!uid) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          profile_image: data.profileImage,
        })
        .eq("uid", uid);

      if (error) throw error;

      // 유저 정보 새로고침
      await refreshUser();

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

  // 로딩 상태 표시
  if (loading) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  }

  return (
    <Container>
      <Heading level={2}>프로필</Heading>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <InputAndTitle title="프로필 이미지">
          <FileUpload
            placeholder=""
            width="100px"
            height="100px"
            initialFileUrl={profileImage || ""}
            onUploadComplete={async (fileUrl) => {
              setValue("profileImage", fileUrl);
              console.log("fileUrl", fileUrl);
            }}
          />
        </InputAndTitle>
        <InputAndTitle title="이름" errorMessage={errors.first_name?.message}>
          <Input type="text" {...register("first_name")} />
        </InputAndTitle>
        <InputAndTitle title="성" errorMessage={errors.last_name?.message}>
          <Input type="text" {...register("last_name")} />
        </InputAndTitle>
        <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
          <Input
            type="email"
            {...register("email")}
            disabled // 이메일은 수정 불가능하게 설정
          />
        </InputAndTitle>

        <Button
          variant="flat"
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          저장
        </Button>
      </Form>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
