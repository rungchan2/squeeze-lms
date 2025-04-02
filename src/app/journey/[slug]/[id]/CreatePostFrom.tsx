"use client";

import MissionCard from "../_plan/MissionCard";
import { useRouter } from "next/navigation";
import Spinner from "@/components/common/Spinner";
import { useMissionInstance } from "@/hooks/useMissionInstance";
import Tiptap from "@/components/richTextInput/RichTextEditor";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import Button from "@/components/common/Button";
import { useEffect, useState, useCallback } from "react";
import { toaster } from "@/components/ui/toaster";
import { createPost, updatePost } from "@/app/journey/actions";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@chakra-ui/react";
import InputAndTitle from "@/components/InputAndTitle";
import userPoint from "@/utils/data/userPoint";
import { useJourneyStore } from "@/store/journey";
import { UpdatePost } from "@/types";
import { useCompletedMissions } from "@/hooks/usePosts";

export default function DoMissionPage({
  updateData,
  updateDataId,
  slug,
  missionInstanceId,
}: {
  updateData?: UpdatePost;
  updateDataId?: number;
  slug?: string;
  missionInstanceId?: number;
}) {
  const { id: userId } = useAuth();
  const router = useRouter();
  const { missionInstance, isLoading, error } =
    useMissionInstance(missionInstanceId || null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 완료된 미션 목록 관리를 위한 훅 추가
  const { refetch: refetchCompletedMissions } = useCompletedMissions(userId || 0);
  
  useEffect(() => {
    if (updateData) {
      setContent(updateData.content || "");
      setTitle(updateData.title || "");
    }
  }, [updateData]);
  
  // 권한 없을 때 뒤로 가거나 여정 페이지로 가는 함수
  const goBackOrJourney = useCallback(() => {
    try {
      // 뒤로 가기 시도
      router.back();
      
      // 만약 뒤로 가기가 불가능하면(직접 URL 접근 등) 1초 후 여정 페이지로 리다이렉션
      setTimeout(() => {
        // 현재 URL이 여전히 같은 페이지라면 여정 페이지로 리다이렉션
        if (window.location.pathname.includes(`/journey/${slug}/${updateDataId}`)) {
          router.push(`/journey/${slug}`);
        }
      }, 1000);
    } catch (e) {
      // 오류 발생 시 여정 페이지로 리다이렉션
      router.push(`/journey/${slug}`);
    }
  }, [router, slug, updateDataId]);
  
  // 권한 체크는 useEffect 내에서 수행, hooks는 조건부로 실행하면 안됨
  useEffect(() => {
    if (updateData && userId !== updateData?.user_id) {
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
      goBackOrJourney();
    }
  }, [updateData, userId, goBackOrJourney]);
  
  if (!userId) return <div>로그인이 필요합니다.</div>;
  if (isLoading) return <Spinner />;
  if (error) return <div>오류가 발생했습니다: {error.message}</div>;
  if (!missionInstance) return <div>미션 인스턴스를 찾을 수 없습니다.</div>;

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault(); // 폼 기본 제출 동작 방지

    if (!content.trim()) {
      toaster.create({
        title: "미션 내용을 입력해주세요.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 포스트 생성
      console.log("미션 제출 시도:", {
        user_id: userId,
        mission_instance_id: missionInstance.id,
        title,
        score: missionInstance.mission.points
      });
      
      const { data, error } = await createPost({
        content: content,
        user_id: userId,
        mission_instance_id: missionInstance.id,
        title: title,
        score: missionInstance.mission.points,
      });
      
      if (error) {
        console.error("미션 제출 오류:", error);
        toaster.create({
          title: "미션 제출 중 오류가 발생했습니다.",
          type: "error",
        });
        return;
      }
      
      console.log("미션 제출 성공:", data);

      // 유저 포인트 생성
      const { error: userPointError } = await userPoint.createUserPoint({
        profile_id: userId,
        mission_instance_id: missionInstance.id,
        post_id: data?.id || 0,
        total_points: missionInstance.mission.points || 0,
      });
      
      if (userPointError) {
        console.error("유저 포인트 생성 오류:", userPointError);
        toaster.create({
          title: "유저 포인트 생성 중 오류가 발생했습니다.",
          description: typeof userPointError === 'object' ? 
            (userPointError as any)?.message || JSON.stringify(userPointError).substring(0, 50) + "..." : 
            String(userPointError),
          type: "error",
        });
      } else {
        console.log("유저 포인트 생성 성공");
      }

      // 완료된 미션 목록 갱신
      await refetchCompletedMissions();
      
      // 성공 알림 후 캐시 무효화 리다이렉션
      toaster.create({
        title: "미션이 성공적으로 제출되었습니다!",
        type: "success",
      });

      // 캐시 무효화를 위해 reload 후 리다이렉션
      setTimeout(() => {
        // replace 메서드를 사용하여 캐시 무효화
        window.location.href = `/journey/${slug}`;
      }, 500);
    } catch (error: any) {
      console.error("미션 제출 중 예외 발생:", error);
      toaster.create({
        title: "미션 제출 중 오류가 발생했습니다.",
        description: error?.message || "다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.preventDefault(); // 폼 기본 제출 동작 방지

    if (!content.trim()) {
      toaster.create({
        title: "미션 내용을 입력해주세요.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await updatePost(
        {
          content: content,
          title: title,
          user_id: userId,
        },
        updateDataId || 0
      );
      if (error) {
        console.error("미션 수정 오류:", error);
        toaster.create({
          title: "미션 수정 중 오류가 발생했습니다.",
          type: "error",
        });
        return;
      }

      toaster.create({
        title: "미션이 성공적으로 수정되었습니다!",
        type: "success",
      });
      // 캐시 무효화를 위해 페이지 새로고침
      window.location.href = `/journey/${slug}`;
    } catch (error: any) {
      console.error("미션 수정 중 예외 발생:", error);
      toaster.create({
        title: "미션 수정 중 오류가 발생했습니다.",
        description: error?.message || "다시 시도해주세요.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MissionContainer>
      <div className="mission-container">
        <Heading level={3}>{missionInstance.mission.name}</Heading>
        <InputAndTitle
          title="미션 제목"
          errorMessage={title.length === 0 ? "미션 제목을 입력해주세요. (이름을 포함해 주세요)" : ""}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="학년 미션 제목을 입력해주세요."
          />
        </InputAndTitle>
        <Tiptap
          placeholder={
            missionInstance.mission.description ||
            "미션가이드에 따라 미션을 완료해주세요."
          }
          content={content}
          onChange={(value) => {
            setContent(value);
          }}
        />
        <Text variant="body" color="grey-700" fontWeight="bold">
          미션 상세 설명
        </Text>
        <MissionCard
          mission={missionInstance.mission}
          showDetails={true}
          isModal={true}
          missionInstance={missionInstance as any}
        />
      </div>
      <div className="button-container">
        <Button
          variant="flat"
          onClick={updateData ? handleUpdate : handleSubmit}
          disabled={isSubmitting || title.length === 0}
        >
          {isSubmitting ? <Spinner /> : updateData ? "수정완료" : "제출"}
        </Button>
      </div>
    </MissionContainer>
  );
}

const MissionContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
  height: calc(100dvh - 100px);
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  .mission-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .button-container {
    margin-top: 16px;
  }
`;
