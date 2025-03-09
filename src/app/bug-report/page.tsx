"use client";

import { Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Heading from "@/components/Text/Heading";
import { useForm, SubmitHandler } from "react-hook-form";
import InputAndTitle from "@/components/InputAndTitle";
import { Input } from "@chakra-ui/react";
import styled from "@emotion/styled";
import Button from "@/components/common/Button";
import { NativeSelect } from "@chakra-ui/react";
import {
  FileUploadList,
  FileUploadRoot,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { MdFileUpload } from "react-icons/md";

import { supabase } from "@/utils/supabase/client";
import { useAuthStore } from "@/store/auth";
import { BugReport } from "@/types";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/utils/uploadFile";
import { toaster } from "@/components/ui/toaster";
import { bugReportSchema } from "@/types/bugReports";
type BugReportFormData = Omit<BugReport, "id" | "created_at" | "updated_at"> & {
  screenshot: FileList;
};

export default function BugReportPage() {
  const { id } = useAuthStore();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BugReportFormData>({});

  const onSubmit: SubmitHandler<BugReportFormData> = async (data) => {
    if (!id) {
      alert("로그인이 필요합니다.");
      return;
    }
    const { data: bugReport, error } = await supabase
      .from("bug_reports")
      .insert({
        user_id: id,
        title: data.title,
        description: data.description,
        status: "open",
      });
    if (error) {
      toaster.error({
        description: "버그 신고에 실패했습니다.",
        type: "error",
        duration: 3000,
      });
      return;
    }
    toaster.success({
      description: "버그 신고가 완료되었습니다.",
      type: "success",
      duration: 3000,
    });
    router.push("/");
  };

  return (
    <StyledContainer>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Heading level={2}>버그 신고</Heading>
        <Text color="var(--grey-500)">
          관리자에게 불편한 점이나 피드백을 전달해주세요.
        </Text>
        <InputAndTitle
          title="페이지"
          errorMessage={errors.title?.message as string}
        >
          <Input {...register("title")} />
        </InputAndTitle>
        <InputAndTitle
          title="설명"
          errorMessage={errors.description?.message as string}
        >
          <Input {...register("description")} />
        </InputAndTitle>
        <InputAndTitle
          title="심각성"
          errorMessage={errors.status?.message as string}
        >
          <NativeSelect.Root>
            <NativeSelect.Field {...register("status")}>
              <option value="사소한 문제">사소한 문제</option>
              <option value="조금 불편함">조금 불편함</option>
              <option value="심각함">심각함</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </InputAndTitle>
        <InputAndTitle
          title="스크린샷"
          errorMessage={errors.screenshot?.message as string}
        >
          <FileUploadRoot
            maxFiles={5}
            maxFileSize={10 * 1024 * 1024}
            accept={["image/png"]}
          >
            <FileUploadTrigger asChild {...register("screenshot")}>
              <Button variant="outline">
                <MdFileUpload /> 스크린샷 업로드
              </Button>
            </FileUploadTrigger>
            <FileUploadList showSize clearable />
          </FileUploadRoot>
        </InputAndTitle>
        <Button type="submit" variant="flat" isLoading={isSubmitting}>
          Submit
        </Button>
      </form>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;
