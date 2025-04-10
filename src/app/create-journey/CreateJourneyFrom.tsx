"use client";

import FileUpload from "@/components/common/FileUpload";
import styled from "@emotion/styled";
import { CreateJourney, createJourneySchema, Journey } from "@/types";
import {
  createJourney,
  updateJourney,
  deleteJourney,
} from "../journey/[slug]/clientActions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@chakra-ui/react";
import InputAndTitle from "@/components/InputAndTitle";
import Button from "@/components/common/Button";
import Heading from "@/components/Text/Heading";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

interface CreateJourneyPageProps {
  initialData?: Journey;
}

export default function CreateJourneyPage({
  initialData,
}: CreateJourneyPageProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateJourney>({
    mode: "onChange",
    resolver: zodResolver(createJourneySchema),
    defaultValues: {
      image_url: initialData?.image_url || "",
      name: initialData?.name || "",
      date_start: initialData?.date_start || "",
      date_end: initialData?.date_end || "",
    },
  });
  const router = useRouter();
  const { role } = useAuth();
  useEffect(() => {
    if (role !== "teacher" && role !== "admin") {
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
      router.push("/");
    }
  }, [role, router]);
  // 초기 데이터 설정은 useEffect 내에서 딱 한 번만 실행
  useEffect(() => {
    if (initialData) {
      setValue("image_url", initialData.image_url || "");
      setValue("name", initialData.name || "");
      setValue("date_start", initialData.date_start || "");
      setValue("date_end", initialData.date_end || "");
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: CreateJourney) => {
    const { error } = initialData
      ? await updateJourney(initialData.id, data)
      : await createJourney(data);
    if (error) {
      toaster.create({
        title: "클라스 생성 실패",
        type: "error",
      });
      setValue("image_url", "");
      setValue("name", "");
      setValue("date_start", "");
      setValue("date_end", "");
    } else {
      toaster.create({
        title: "클라스 생성 성공",
        type: "success",
      });
      router.back();
    }
  };

  return (
    <StyledContainer onSubmit={handleSubmit(onSubmit)}>
      <div className="input-container">
        <div className="heading-container">
          <Heading level={3}>
            {initialData ? "클라스 수정" : "클라스 생성"}
          </Heading>
          {initialData && (
            <Button
              variant="outline"
              style={{
                color: "var(--negative-600)",
                borderColor: "var(--negative-600)",
                maxWidth: "100px",
              }}
              onClick={(e) => {
                e.preventDefault();
                if (confirm("정말 삭제하시겠습니까?")) {
                  deleteJourney(initialData.id);
                  router.back();
                }
              }}
            >
              삭제
            </Button>
          )}
        </div>
        <InputAndTitle
          title="클라스 이미지"
          errorMessage={errors.image_url?.message}
        >
          <FileUpload
            initialFileUrl={watch("image_url")}
            width="150px"
            height="150px"
            {...register("image_url")}
            onUploadComplete={(fileUrl) => setValue("image_url", fileUrl)}
          />
        </InputAndTitle>
        <InputAndTitle title="클라스 이름" errorMessage={errors.name?.message}>
          <Input {...register("name")} />
        </InputAndTitle>
        <InputAndTitle title="시작일" errorMessage={errors.date_start?.message}>
          <Input type="date" {...register("date_start")} />
        </InputAndTitle>
        <InputAndTitle title="종료일" errorMessage={errors.date_end?.message}>
          <Input type="date" {...register("date_end")} />
        </InputAndTitle>
      </div>
      <Button
        type="submit"
        variant="flat"
        disabled={
          isSubmitting ||
          watch("name") === "" ||
          watch("date_start") === "" ||
          watch("date_end") === "" ||
          watch("image_url") === ""
        }
      >
        {initialData ? "클라스 수정" : "클라스 생성"}
      </Button>
    </StyledContainer>
  );
}

const StyledContainer = styled.form`
  height: calc(100dvh - 100px);
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;

  .heading-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
`;
