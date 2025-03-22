"use client";

import { CreateMission } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMissionSchema } from "@/types";
import InputAndTitle from "@/components/InputAndTitle";
import { createListCollection, Input, Portal, Select } from "@chakra-ui/react";
import { Textarea } from "@chakra-ui/react";
import Button from "@/components/common/Button";
import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import { createMission } from "../../actions";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

export default function NewMissionPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMission>({
    resolver: zodResolver(createMissionSchema),
  });

  console.log(errors);

  const onSubmit = async (data: CreateMission) => {
    console.log(data);
    const { error } = await createMission(data);
    if (error) {
      toaster.create({
        title: "미션 생성 실패",
        type: "error",
      });
      return;
    }

    toaster.create({
      title: "미션 생성 성공",
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
        <Heading level={3}>미션 생성</Heading>
        <InputAndTitle title="미션 이름" errorMessage={errors.name?.message}>
          <Input {...register("name")} />
        </InputAndTitle>
        <InputAndTitle title="미션 점수" errorMessage={errors.points?.message}>
          <Input
            {...register("points", {
              valueAsNumber: true,
            })}
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
          errorMessage={errors.description?.message}
        >
          <Textarea {...register("description")} />
        </InputAndTitle>
      </div>
      <Button variant="flat" onClick={handleSubmit(onSubmit)}>
        미션 생성
      </Button>
    </NewMissionPageContainer>
  );
}

const NewMissionPageContainer = styled.div`
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
