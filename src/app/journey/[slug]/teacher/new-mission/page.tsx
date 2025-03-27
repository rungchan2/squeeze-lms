"use client";

import { CreateMission, Mission } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMissionSchema } from "@/types";
import InputAndTitle from "@/components/InputAndTitle";
import { createListCollection, Input, Portal, Select } from "@chakra-ui/react";
import Button from "@/components/common/Button";
import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { mission } from "@/utils/data/mission";
import Tiptap from "@/components/richTextInput/RichTextEditor";

export default function NewMissionPage({ editMissionData }: { editMissionData?: Mission }) {
  const router = useRouter();
  const { role } = useAuth();
  const [content, setContent] = useState<string | null>(editMissionData?.description || "");
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  
  useEffect(() => {
    if (role === "user") {
      router.push("/");
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
    }
  }, [role, router]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMission>({
    resolver: zodResolver(createMissionSchema),
    defaultValues: editMissionData,
  });

  console.log(errors);

  const onSubmit = async (data: CreateMission) => {
    // 컨텐츠 검증
    if (!content || content === "" || content === "<p>미션가이드에 따라 미션을 완료해주세요.</p>") {
      setDescriptionError("미션 설명을 입력해주세요.");
      return;
    } else {
      setDescriptionError(null);
    }
    
    console.log(data);
    if (editMissionData) {
      const { error: updateError } = await mission.updateMission(editMissionData.id, {
        ...data,
        description: content
      });
      if (updateError) {
        toaster.create({
          title: "미션 수정 실패",
          type: "error",
        });
        return;
      }
    } else {
      const { error: createError } = await mission.createMission({
        ...data,
        description: content
      });
      if (createError) {
        toaster.create({
          title: "미션 생성 실패",
          type: "error",
        });
        return;
      }
    }
    toaster.create({
      title: `${editMissionData ? "미션 수정" : "미션 생성"} 성공`,
      type: "success",
    });

    router.back();
  };

  const missionTypes = createListCollection({
    items: [
      { label: "텍스트", value: "text" },
      { label: "이미지", value: "image" },
      { label: "비디오", value: "video" },
    ],
  });

  return (
    <NewMissionPageContainer>
      <div className="input-container">
        <Heading level={3}>미션 {editMissionData ? "수정" : "생성"}</Heading>
        <InputAndTitle title="미션 이름" errorMessage={errors.name?.message}>
          <Input {...register("name")} placeholder="미션 이름을 입력해주세요." />
        </InputAndTitle>
        <InputAndTitle title="미션 점수" errorMessage={errors.points?.message}>
          <Input
            {...register("points", {
              valueAsNumber: true,
            })}
            placeholder="미션 점수를 입력해주세요.(숫자)"
          />
        </InputAndTitle>
        <InputAndTitle
          title="미션 타입"
          errorMessage={errors.mission_type?.message}
        >
          <Select.Root
            collection={missionTypes}
            backgroundColor="white"
            {...register("mission_type")}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="미션 타입" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {missionTypes.items.map((missionType) => (
                    <Select.Item item={missionType} key={missionType.value}>
                      {missionType.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </InputAndTitle>
        <InputAndTitle
          title="미션 설명"
          errorMessage={descriptionError || errors.description?.message}
        >
          <Tiptap
          inputHeight="300px"
          placeholder={
            "미션가이드에 따라 미션을 완료해주세요."
          }
          content={content || ""}
          onChange={(value) => {
            setContent(value);
            setDescriptionError(null);
          }}
        />
        </InputAndTitle>
      </div>
      <Button variant="flat" onClick={handleSubmit(onSubmit)}>
        미션 {editMissionData ? "수정" : "생성"}
      </Button>
    </NewMissionPageContainer>
  );
}

const NewMissionPageContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  justify-content: space-between;
  height: calc(100vh - 100px);

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }
`;

//TODO: 1. 미션 생성 페이지 및 수정 페이지
