"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@chakra-ui/react";
import styled from "@emotion/styled";

import { useAuth } from "@/components/AuthProvider"; // 수정된 인증 컨텍스트 사용
import { supabase } from "@/utils/supabase/client";
import Heading from "@/components/Text/Heading";
import Spinner from "@/components/common/Spinner";
import InputAndTitle from "@/components/InputAndTitle";
import Button from "@/components/common/Button";
import { toaster } from "@/components/ui/toaster";
import imageCompression from "browser-image-compression";

// 유효성 검증 스키마
const minLength = "이름은 1자 이상 입력해주세요.";
const maxLength = "이름은 10자 이하로 입력해주세요.";

const schema = z.object({
  first_name: z.string().min(1, minLength).max(10, maxLength),
  last_name: z.string().min(1, minLength).max(10, maxLength),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  profile_image: z.string().optional(),
});

type ProfileForm = z.infer<typeof schema>;

export default function ProfilePage() {
  // useAuth 훅 사용
  const { isAuthenticated, loading, uid, refreshUser } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  // 폼 설정
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  // 인증 상태 확인 및 리디렉션
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      toaster.create({
        title: "로그인이 필요합니다.",
        description: "로그인 페이지로 이동합니다.",
        type: "error",
      });
    }
  }, [loading, isAuthenticated, router]);

  // 프로필 데이터 로드
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!uid) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("uid", uid)
          .single();

        if (error) throw error;

        // 폼에 데이터 설정
        if (data) {
          setValue("first_name", data.first_name || "");
          setValue("last_name", data.last_name || "");
          setValue("email", data.email || "");
          setValue("profile_image", data.profile_image || "");
        }
      } catch (error) {
        console.error("프로필 데이터 로드 중 오류:", error);
        toaster.create({
          title: "데이터 로드 실패",
          description: "프로필 정보를 가져오는데 실패했습니다.",
          type: "error",
        });
      }
    };

    if (isAuthenticated && uid) {
      fetchProfileData();
    }
  }, [isAuthenticated, uid, setValue]);

  // 프로필 이미지 처리 함수
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const compressedFile = await imageCompression(files[0], {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    });

    try {
      setIsUploading(true);
      const file = compressedFile;
      const fileExt = file.name.split('.').pop();
      const fileName = `${uid}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // 파일 업로드
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 공개 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setValue("profile_image", urlData.publicUrl);
      setIsUploading(false);
    } catch (error) {
      console.error("이미지 업로드 중 오류:", error);
      toaster.create({
        title: "이미지 업로드 실패",
        description: "프로필 이미지 업로드에 실패했습니다.",
        type: "error",
      });
      setIsUploading(false);
    }
  };

  // 폼 제출 처리
  const onSubmit = async (data: ProfileForm) => {
    if (!uid) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          profile_image: data.profile_image
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
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Heading level={2}>프로필</Heading>
        <InputAndTitle title="이름" errorMessage={errors.first_name?.message}>
          <Input
            type="text"
            {...register("first_name")}
          />
        </InputAndTitle>
        <InputAndTitle title="성" errorMessage={errors.last_name?.message}>
          <Input
            type="text"
            {...register("last_name")}
          />
        </InputAndTitle>
        <InputAndTitle title="이메일" errorMessage={errors.email?.message}>
          <Input
            type="email"
            {...register("email")}
            disabled // 이메일은 수정 불가능하게 설정
          />
        </InputAndTitle>
        <InputAndTitle
          title="프로필 이미지"
          errorMessage={errors.profile_image?.message}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <input
            type="hidden"
            {...register("profile_image")}
          />
          {isUploading && <Spinner size="sm" />}
        </InputAndTitle>
        <Button 
          variant="flat" 
          type="submit" 
          isLoading={isSubmitting || isUploading}
          disabled={isSubmitting || isUploading}
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
  padding: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;