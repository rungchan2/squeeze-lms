"use client";

import { Text, Textarea } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Heading from "@/components/Text/Heading";
import { useForm, SubmitHandler } from "react-hook-form";
import InputAndTitle from "@/components/InputAndTitle";
import { Input } from "@chakra-ui/react";
import styled from "@emotion/styled";
import Button from "@/components/common/Button";
import { NativeSelect } from "@chakra-ui/react";
import { CreateBugReport, createBugReportSchema } from "@/types";
import { useRouter } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { createBugReport } from "../clientActions";
import FileUpload from "@/components/common/FileUpload";
import { redirect } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { createIssue } from "@/utils/github/createIssue";

export default function BugReport() {
  const { isAuthenticated, id } = useSupabaseAuth();
  if (!isAuthenticated) {
    redirect("/login");
  }
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreateBugReport>({
    mode: "onChange",
    resolver: zodResolver(createBugReportSchema),
    defaultValues: {
      user_id: id || 0,
      file_url: "",
    },
  });

  const onSubmit: SubmitHandler<CreateBugReport> = async (data) => {
    if (!id) {
      alert("로그인이 필요합니다.");
      return;
    }
    const insertData: CreateBugReport = {
      user_id: id,
      title: data.title,
      description: data.description,
      status: data.status,
      file_url: data.file_url,
    };
    const { error } = await createBugReport(insertData);

    // 심각성에 따른 버그 타입 매핑
    let bugType: "bug-low" | "bug-mid" | "bug-serious" = "bug-low";
    if (data.status === "사소한 문제") {
      bugType = "bug-low";
    } else if (data.status === "조금 불편함") {
      bugType = "bug-mid";
    } else if (data.status === "심각함") {
      bugType = "bug-serious";
    }

    // GitHub 이슈 생성 시도 - 오류가 발생해도 나머지 동작은 계속 진행
    try {
      const issueResponse = await createIssue(data.title, data.description, bugType);
      
      if (issueResponse.success) {
      } else {
        console.error("GitHub 이슈 생성에 실패했습니다:", issueResponse.error);
      }
    } catch (issueError) {
      console.error("GitHub 이슈 생성 중 오류가 발생했습니다:", issueError);
      // 이슈 생성 실패해도 기존 버그 리포트 처리는 계속 진행
    }

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
        <div className="heading-container">
          <Heading level={3}>버그 신고</Heading>
          <Text color="var(--grey-500)">
            관리자에게 불편한 점이나 피드백을 전달해주세요.
          </Text>
        </div>
        <div className="input-container">
          <InputAndTitle
            title="페이지/제목"
            errorMessage={errors.title?.message as string}
          >
            <Input {...register("title")} />
          </InputAndTitle>
          <InputAndTitle
            title="설명"
            errorMessage={errors.description?.message as string}
          >
            <Textarea minHeight={120} {...register("description")} placeholder="해당 버그의 재현 방법, 현재 기기/브라우저, 버그로 인한 영향을 작성해주세요." />
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
          <InputAndTitle title="스크린샷">
            <FileUpload
              onUploadComplete={(fileUrl) => {
                setValue("file_url", fileUrl);
              }}
            />
          </InputAndTitle>
        </div>
        <Button
          type="submit"
          variant="flat"
          isLoading={isSubmitting}
          disabled={!isValid}
        >
          Submit
        </Button>
      </form>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;

  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .input-container {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;
