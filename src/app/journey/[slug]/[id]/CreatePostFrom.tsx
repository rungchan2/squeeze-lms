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
import { useEffect, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { createPost, updatePost } from "@/utils/data/posts";
import { Input } from "@chakra-ui/react";
import InputAndTitle from "@/components/InputAndTitle";
import userPoint from "@/utils/data/userPoint";
import { UpdatePost } from "@/types";
import { useCompletedMissions } from "@/hooks/usePosts";
import { Error } from "@/components/common/Error";
import { JourneyMissionInstanceWithMission } from "@/types";
import { StlyedSelect } from "@/components/select/Select";
import { useTeams } from "@/hooks/useTeams";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

type TeamMember = {
  label: string;
  value: string;
  isFixed: boolean;
};

export default function DoMissionPage({
  updateData,
  updateDataId,
  slug,
  missionInstanceId,
}: {
  updateData?: UpdatePost;
  updateDataId?: string;
  slug?: string;
  missionInstanceId?: string;
}) {
  const { id: userId } = useSupabaseAuth();
  const router = useRouter();
  const { missionInstance, isLoading, error } = useMissionInstance(
    missionInstanceId || ""
  );
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTeamMission = missionInstance?.mission.mission_type === "team";
  const [selectedTeamMembers, setSelectedTeamMembers] =
    useState<TeamMember[] | undefined>();

  // useTeams 훅 사용
  const { teamData, markPostAsTeamSubmission } = useTeams(slug ?? "");

  // 완료된 미션 목록 관리를 위한 훅 추가
  const { refetch: refetchCompletedMissions } = useCompletedMissions(
    userId || "",
    slug || ""
  );
  // 권한 체크는 useEffect 내에서 수행, hooks는 조건부로 실행하면 안됨
  useEffect(() => {
    if (updateData && userId !== updateData?.user_id) {
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
      router.push(`/journey/${slug}`);
    }
  }, [updateData, userId, router, slug]);

  useEffect(() => {
    if (updateData) {
      setContent(updateData.content || "");
      setTitle(updateData.title || "");
    }
  }, [updateData]);

  // 팀 데이터 로딩 시 팀원 목록 초기화
  useEffect(() => {
    // 팀이 있는 경우 팀원 정보 가져오기
    if (teamData && teamData.members && teamData.members.length > 0) {
      const teamMembers = teamData.members.map((member) => ({
        label: `${member.profiles?.first_name || ""} ${
          member.profiles?.last_name || ""
        }`,
        value: member.user_id,
        isFixed: member.user_id === userId || member.is_leader === true,
      }));

      setSelectedTeamMembers(teamMembers);
    }
  }, [teamData, userId]);

  if (!userId) return <Error message="로그인이 필요합니다." />;
  if (isLoading) return <Spinner />;
  if (error) return <Error message={`오류가 발생했습니다: ${error.message}`} />;

  // 팀 생성 또는 업데이트 처리
  const handleTeamSubmission = async (postId: string) => {
    try {
      if (!missionInstance) return false;

      const success = await markPostAsTeamSubmission(
        postId,
        missionInstance.mission.points || 0
      );

      if (!success) {
        console.error("팀 제출 처리 중 오류 발생");
        return false;
      }

      return true;
    } catch (error) {
      console.error("팀 제출 처리 중 오류:", error);
      return false;
    }
  };

  const handleSubmit = async (
    missionInstance: JourneyMissionInstanceWithMission
  ) => {
    if (!content.trim()) {
      toaster.create({
        title: "미션 내용을 입력해주세요.",
        type: "warning",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await createPost({
        content: content,
        user_id: userId,
        mission_instance_id: missionInstance.id,
        title: title,
        score: missionInstance.mission.points || 0,
        journey_id: missionInstance.journey_id || "",
      });

      if (error) {
        console.error("미션 제출 오류:", error);
        toaster.create({
          title: "미션 제출 중 오류가 발생했습니다.",
          type: "error",
        });
        return;
      }

      // 팀 미션인 경우 팀 처리
      if (isTeamMission && data?.id) {
        const success = await handleTeamSubmission(data.id);
        if (!success) {
          toaster.create({
            title: "팀 처리 중 오류가 발생했습니다.",
            type: "error",
          });
        }
      } else {
        // 팀 미션이 아닌 경우 일반 유저 포인트 생성
        const { error: userPointError } = await userPoint.createUserPoint({
          profile_id: userId,
          mission_instance_id: missionInstance.id,
          post_id: data?.id || "",
          total_points: missionInstance.mission.points || 0,
        });

        if (userPointError) {
          console.error("유저 포인트 생성 오류:", userPointError);
          toaster.create({
            title: "유저 포인트 생성 중 오류가 발생했습니다.",
            description:
              typeof userPointError === "object"
                ? (userPointError as any)?.message ||
                  JSON.stringify(userPointError).substring(0, 50) + "..."
                : String(userPointError),
            type: "error",
          });
        }
      }

      // 완료된 미션 목록 갱신
      await refetchCompletedMissions();

      // 성공 알림 후 캐시 무효화 리다이렉션
      toaster.create({
        title: "미션이 성공적으로 제출되었습니다!",
        type: "success",
      });

      router.push(`/journey/${slug}`);
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
        updateDataId || ""
      );
      if (error) {
        console.error("미션 수정 오류:", error);
        toaster.create({
          title: "미션 수정 중 오류가 발생했습니다.",
          type: "error",
        });
        return;
      }

      // 팀 미션인 경우 팀 처리 업데이트
      if (isTeamMission && updateDataId) {
        const success = await handleTeamSubmission(updateDataId);
        if (!success) {
          toaster.create({
            title: "팀 처리 중 오류가 발생했습니다.",
            type: "error",
          });
        }
      }

      toaster.create({
        title: "미션이 성공적으로 수정되었습니다!",
        type: "success",
      });
      // 캐시 무효화를 위해 페이지 새로고침
      if (!slug) {
        router.back();
      } else {
        window.location.href = `/journey/${slug}`;
      }
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
        <Heading level={4}>
          {missionInstance
            ? missionInstance.mission.name
            : "미션 (삭제된 과제 입니다)"}
        </Heading>
        <InputAndTitle
          title="미션 제목"
          errorMessage={
            title.length === 0
              ? "미션 제목을 입력해주세요. (이름을 포함해 주세요)"
              : ""
          }
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="학년 미션 제목을 입력해주세요."
          />
        </InputAndTitle>
        <Tiptap
          placeholder={
            updateData?.content ||
            missionInstance?.mission.description ||
            "미션가이드에 따라 미션을 완료해주세요."
          }
          content={content}
          onChange={(value) => {
            setContent(value);
          }}
          inputHeight="250px"
        />

        <Text variant="body" color="grey-700" fontWeight="bold">
          미션 상세 설명
        </Text>
        <MissionCard
          mission={missionInstance?.mission}
          showDetails={true}
          isModal={true}
          missionInstance={missionInstance as any}
        />
        {isTeamMission && (
        <TeamSelectSection>
          <Text variant="body" color="grey-700" fontWeight="bold">
            과제 수행 팀 : {teamData?.team?.name}
          </Text>
          {teamData?.members && teamData.members.length <= 1 ? (
            <EmptyTeamMessage>
              <Text variant="body" color="grey-500">
                팀원이 없습니다. 팀원을 초대해주세요.
              </Text>
            </EmptyTeamMessage>
          ) : (
            <StlyedSelect
              defaultValues={selectedTeamMembers || []}
              isDisabled={true}
              options={teamData?.members.map((member) => ({
                label: `${member.profiles?.first_name || ""} ${
                  member.profiles?.last_name || ""
                }`,
                value: member.user_id,
              }))}
            />
          )}
        </TeamSelectSection>
      )}
      </div>
      {/* 팀 미션인 경우 팀원 선택 컴포넌트 추가 */}
      
      <div className="button-container">
        <Button
          variant="flat"
          onClick={
            updateData
              ? handleUpdate
              : () => handleSubmit(missionInstance as any)
          }
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
    gap: 12px;
  }

  .button-container {
    margin-top: 16px;
  }
`;

const TeamSelectSection = styled.div`
  display: flex;
  margin-top: 16px;
  flex-direction: column;
  gap: 8px;
  background-color: var(--grey-100);
  border-radius: 8px;

  .help-text {
    color: var(--grey-500);
    margin-bottom: 8px;
  }
`;

const EmptyTeamMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  background-color: var(--grey-100);
  border-radius: 8px;
`;
