"use client";

import { useJourneyStore } from "@/store/journey";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import Heading from "@/components/Text/Heading";
import styled from "@emotion/styled";
import { StlyedSelect } from "@/components/select/Select";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Text from "@/components/Text/Text";
import { toaster } from "@/components/ui/toaster";
import { useTeams } from "@/hooks/useTeams";
import Spinner from "@/components/common/Spinner";
import Button from "@/components/common/Button";
import { Modal } from "@/components/modal/Modal";
import InputAndTitle from "@/components/InputAndTitle";
import { Input } from "@chakra-ui/react";
import { formatDifference } from "@/utils/dayjs/calcDifference";
import { FaRegTrashAlt, FaTrash } from "react-icons/fa";
import { team } from "@/utils/data/team";
import { IoRefreshSharp } from "react-icons/io5";

export default function TeamsPage() {
  const { currentJourneyId } = useJourneyStore();
  const { id: currentUserId } = useAuth();
  const { data: journeyUsers } = useJourneyUser(currentJourneyId ?? 0);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] =
    useState("미션을 함께 수행할 팀입니다.");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamSelections, setTeamSelections] = useState<Record<number, any[]>>(
    {}
  );

  // useTeams 훅 사용
  const {
    teamData,
    allTeamsData,
    isLoading,
    isLoadingAllTeams,
    updateTeamMembers,
    createTeam,
    joinTeam,
    leaveTeam,
    deleteTeam,
    checkUserTeam,
    getUsersWithTeam,
    mutateAllTeams
  } = useTeams(currentJourneyId ?? 0);

  // 팀원 옵션 생성 및 이미 팀에 속한 사용자 표시
  const [usersWithTeam, setUsersWithTeam] = useState<number[]>([]);
  const [isLoadingUserTeams, setIsLoadingUserTeams] = useState(false);

  // 이미 팀에 속한 사용자 정보 로드
  useEffect(() => {
    const loadUsersWithTeam = async () => {
      if (!currentJourneyId) return;
      setIsLoadingUserTeams(true);
      try {
        const userIds = await getUsersWithTeam();
        setUsersWithTeam(userIds);
      } catch (error) {
        console.error("팀 소속 사용자 목록 로드 중 오류:", error);
      } finally {
        setIsLoadingUserTeams(false);
      }
    };
    
    loadUsersWithTeam();
  }, [currentJourneyId, getUsersWithTeam]);

  // 팀원 옵션 생성 (내 이름 옆에 (나) 표시 및 이미 팀에 속한 사용자 표시)
  const teamOptions =
    journeyUsers?.map((user) => {
      const userId = user.user_id;
      const isCurrentUser = userId === currentUserId;
      // 이미 팀에 속한 사용자인지 확인 (현재 사용자 제외)
      const isInOtherTeam = !isCurrentUser && usersWithTeam.includes(userId);
      
      // 사용자가 현재 속한 팀 ID
      let userTeamIdText = '';
      if (isInOtherTeam && allTeamsData?.teams) {
        // allTeamsData.teamMembers에서 해당 사용자가 속한 팀 찾기
        for (const teamId in allTeamsData.teamMembers) {
          const teamMembers = allTeamsData.teamMembers[teamId] || [];
          if (teamMembers.some(member => member.user_id === userId)) {
            const teamInfo = allTeamsData.teams.find(t => t.id === Number(teamId));
            if (teamInfo) {
              userTeamIdText = ` (${teamInfo.name})`;
              break;
            }
          }
        }
      }
      
      return {
        label: `${user.profiles?.first_name} ${user.profiles?.last_name}${isCurrentUser ? ' (나)' : ''}${isInOtherTeam ? userTeamIdText : ''}`,
        value: userId,
        isDisabled: isInOtherTeam, // 다른 팀에 속한 경우 선택 불가
        color: isCurrentUser ? 'var(--primary-900)' : undefined
      };
    }) || [];

  useEffect(() => {
    if (allTeamsData?.teams) {
      const selections: Record<number, any[]> = {};

      allTeamsData.teams.forEach((team) => {
        const teamId = team.id;
        const members = allTeamsData.teamMembers[teamId] || [];

        selections[teamId] = members.map((member) => {
          const isCurrentUser = member.user_id === currentUserId;
          return {
            label: `${member.profiles?.first_name || ""} ${
              member.profiles?.last_name || ""
            }${isCurrentUser ? ' (나)' : ''}`,
            value: member.user_id,
            isFixed: member.is_leader, // 리더는 고정(제거할 수 없음)
            color: isCurrentUser ? 'var(--primary-900)' : undefined
          };
        });
      });

      // 이전 상태와 비교 후 변경된 경우에만 업데이트
      setTeamSelections((prev) => {
        // Object.keys를 사용하여 이전 선택과 새 선택을 비교
        const prevKeys = Object.keys(prev).map(Number);
        const newKeys = Object.keys(selections).map(Number);

        // 키 목록이 다른 경우 업데이트
        if (
          JSON.stringify(prevKeys.sort()) !== JSON.stringify(newKeys.sort())
        ) {
          return selections;
        }

        // 각 팀의 멤버 목록이 변경된 경우에만 업데이트
        let hasChanges = false;
        for (const teamId in selections) {
          if (
            !prev[teamId] ||
            JSON.stringify(prev[teamId].map((m) => m.value).sort()) !==
              JSON.stringify(selections[teamId].map((m) => m.value).sort())
          ) {
            hasChanges = true;
            break;
          }
        }

        return hasChanges ? selections : prev;
      });
    }
  }, [allTeamsData?.teams, allTeamsData?.teamMembers, currentUserId]);

  // 모달에서 팀 생성 준비
  const handleOpenCreateTeamModal = () => {
    // 기본 팀 이름 설정
    const currentUser = journeyUsers?.find(
      (user) => user.user_id === currentUserId
    );
    if (currentUser) {
      setTeamName(`${currentUser.profiles?.first_name || ""}의 팀`);
    } else {
      setTeamName("");
    }
    setTeamDescription("미션을 함께 수행할 팀입니다.");
    setShowCreateTeamModal(true);
  };

  // 팀 생성 핸들러
  const handleCreateTeam = async () => {
    if (!currentUserId || !currentJourneyId) return;

    if (!teamName.trim()) {
      toaster.create({
        title: "팀 이름을 입력해주세요",
        type: "warning",
      });
      return;
    }

    setIsCreatingTeam(true);
    // 팀 생성
    const result = await createTeam(teamName, teamDescription);
    setIsCreatingTeam(false);

    if (result) {
      setShowCreateTeamModal(false);
    }
  };

  // 팀원 변경 핸들러
  const handleTeamMembersChange = async (teamId: number, newMembers: any[]) => {
    if (!currentUserId) return;

    // 현재 팀원 목록
    const currentMembers = allTeamsData.teamMembers[teamId] || [];
    const currentMemberIds = currentMembers.map((m) => m.user_id);

    // 새로 추가된 팀원 찾기
    const newMemberIds = newMembers.map((m) => m.value);
    const addedMemberIds = newMemberIds.filter(
      (id) => !currentMemberIds.includes(id)
    );

    // 제거된 팀원 찾기
    const removedMemberIds = currentMemberIds.filter(
      (id) => !newMemberIds.includes(id)
    );

    // 리더 찾기
    const leader = currentMembers.find((m) => m.is_leader);

    // 리더를 제거하려고 하는 경우
    if (leader && removedMemberIds.includes(leader.user_id)) {
      toaster.create({
        title: "팀 리더는 제거할 수 없습니다",
        type: "warning",
      });
      return;
    }

    // 추가하려는 사용자 중 이미 다른 팀에 속한 사용자가 있는지 확인
    for (const userId of addedMemberIds) {
      // 현재 사용자는 팀 변경이 가능하므로 제외
      if (userId === currentUserId) continue;
      
      // 사용자가 이미 다른 팀에 속해 있는지 확인
      const userInTeam = usersWithTeam.includes(userId);
      if (userInTeam) {
        let userTeamId: number | null = null;
        
        // allTeamsData에서 사용자가 속한 팀 찾기
        for (const tId in allTeamsData.teamMembers) {
          const memberList = allTeamsData.teamMembers[tId] || [];
          if (memberList.some(m => m.user_id === userId)) {
            userTeamId = Number(tId);
            break;
          }
        }
        
        // 다른 팀에 속한 경우
        if (userTeamId !== null && userTeamId !== teamId) {
          const userInfo = journeyUsers?.find(u => u.user_id === userId);
          const userName = userInfo ? 
            `${userInfo.profiles?.first_name || ""} ${userInfo.profiles?.last_name || ""}` : 
            "선택한 사용자";
            
          toaster.create({
            title: "팀 추가 불가",
            description: `${userName}님은 이미 다른 팀에 속해 있습니다.`,
            type: "warning",
          });
          return;
        }
      }
    }

    // 현재 사용자가 속한 다른 팀 ID 찾기
    let currentUserTeamId = null;
    if (teamData.team && teamData.team.id !== teamId) {
      currentUserTeamId = teamData.team.id;
    }

    // 현재 사용자가 새로 추가되었고, 다른 팀에 이미 속해있는 경우
    if (addedMemberIds.includes(currentUserId) && currentUserTeamId) {
      // 이전 팀에서 나가기
      const leaveSuccess = await leaveTeam();
      if (!leaveSuccess) {
        toaster.create({
          title: "기존 팀에서 나가기 실패",
          type: "error",
        });
        return;
      }
    }

    // 변경사항 적용
    let success = true;

    // 멤버 추가
    for (const userId of addedMemberIds) {
      const isCurrentUser = userId === currentUserId;

      if (isCurrentUser) {
        // 현재 사용자가 자신을 팀에 추가하는 경우, joinTeam 사용
        const joinSuccess = await joinTeam(teamId);
        if (!joinSuccess) success = false;
      } else {
        // 다른 사용자를 추가하는 경우
        try {
          const addMemberError = await team.addTeamMember(teamId, userId);
          if (addMemberError) {
            console.error("팀원 추가 중 오류:", addMemberError);
            success = false;
          }
        } catch (error) {
          console.error(
            `사용자(${userId})를 팀(${teamId})에 추가하는 중 예외 발생:`,
            error
          );
          success = false;
        }
      }
    }

    // 멤버 제거 (현재 사용자가 자신을 제거하는 경우 제외 - 이미 leaveTeam으로 처리됨)
    for (const userId of removedMemberIds) {
      if (userId === currentUserId && teamId === currentUserTeamId) continue;

      try {
        const removeMemberError = await team.removeTeamMember(teamId, userId);
        if (removeMemberError) {
          console.error("팀원 제거 중 오류:", removeMemberError);
          success = false;
        }
      } catch (error) {
        console.error(
          `사용자(${userId})를 팀(${teamId})에서 제거하는 중 예외 발생:`,
          error
        );
        success = false;
      }
    }

    if (success) {
      toaster.create({
        title: "팀원이 업데이트되었습니다",
        type: "success",
      });

      // 선택 상태 업데이트
      setTeamSelections((prev) => ({
        ...prev,
        [teamId]: newMembers,
      }));
    } else {
      toaster.create({
        title: "팀원 업데이트 중 일부 오류가 발생했습니다",
        type: "warning",
      });
    }
  };

  const handleRefreshTeam = async (teamId: number) => {
    try {
      // 모든 팀 데이터 새로고침
      await mutateAllTeams();
      
      // 특정 팀에 대한 멤버 조회
      const teamMembers = await team.getTeamMembers([teamId]);
      
      // 팀 소속 사용자 목록 업데이트
      const updatedUsersWithTeam = await getUsersWithTeam();
      setUsersWithTeam(updatedUsersWithTeam);
      
      // 팀원 목록이 업데이트된 후 UI 업데이트
      const members = teamMembers.filter(member => member.team_id === teamId);
      
      // 해당 팀에 대한 선택 상태 업데이트
      const updatedMembers = members.map(member => {
        const isCurrentUser = member.user_id === currentUserId;
        return {
          label: `${member.profiles?.first_name || ""} ${member.profiles?.last_name || ""}${isCurrentUser ? ' (나)' : ''}`,
          value: member.user_id,
          isFixed: member.is_leader, // 리더는 고정
          color: isCurrentUser ? 'var(--primary-900)' : undefined
        };
      });
      
      // 특정 팀의 선택 상태만 업데이트
      setTeamSelections(prev => ({
        ...prev,
        [teamId]: updatedMembers
      }));
      
      toaster.create({
        title: "팀원 목록이 새로고침되었습니다",
        type: "success",
      });
    } catch (error) {
      console.error("팀원 목록 새로고침 중 오류:", error);
      toaster.create({
        title: "팀원 목록 새로고침 중 오류가 발생했습니다",
        type: "error",
      });
    }
  };

  return (
    <PageContainer>
      <PageHeader>
        <Heading level={4}>팀 관리</Heading>
        <Text variant="body" color="var(--grey-500)">
          팀을 생성하거나 기존 팀에 참여할 수 있습니다. 각 팀의 멤버를 선택하여
          팀원을 관리하세요.
        </Text>
        <Button variant="flat" onClick={handleOpenCreateTeamModal}>
          새 팀 생성
        </Button>
      </PageHeader>

      {isLoading || isLoadingAllTeams ? (
        <LoadingContainer>
          <Text variant="body">팀 데이터를 불러오는 중입니다...</Text>
          <Spinner />
        </LoadingContainer>
      ) : (
        <>
          {allTeamsData.teams.length === 0 ? (
            <EmptyState>
              <div className="empty-state-content">
                <Text variant="body">아직 생성된 팀이 없습니다.</Text>
                <Text variant="caption">
                  새 팀을 생성하여 미션을 함께 수행할 팀원을 초대해보세요.
                </Text>
                <Button variant="flat" onClick={handleOpenCreateTeamModal}>
                  팀 생성하기
                </Button>
              </div>
            </EmptyState>
          ) : (
            <TeamsGrid>
              {allTeamsData.teams.map((team) => (
                <TeamCard key={team.id}>
                  <div className="team-card-header">
                    <Heading level={5}>{team.name}</Heading>
                    <div className="team-card-header-right">
                      <Text variant="small" className="team-date">
                        {formatDifference(team.created_at ?? "")}
                      </Text>
                      <IoRefreshSharp
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          handleRefreshTeam(team.id);
                        }}
                      />
                      <FaRegTrashAlt
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          if (confirm("팀을 삭제하시겠습니까?")) {
                            deleteTeam(team.id);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="team-description">
                    <Text variant="caption">
                      {team.description || "설명이 없습니다."}
                    </Text>
                  </div>

                  <div className="members-container">
                    <Text variant="caption" className="members-title">
                      팀원 ({allTeamsData.teamMembers[team.id]?.length || 0}명)
                    </Text>
                    {teamSelections[team.id] && (
                      <StlyedSelect
                        options={teamOptions}
                        defaultValues={teamSelections[team.id]}
                        onChange={(newValues) =>
                          handleTeamMembersChange(team.id, newValues)
                        }
                        onBlur={() => {}}
                      />
                    )}
                  </div>
                </TeamCard>
              ))}
            </TeamsGrid>
          )}

          {/* 팀 생성 모달 */}
          <Modal
            isOpen={showCreateTeamModal}
            onClose={() => setShowCreateTeamModal(false)}
            title="새 팀 생성"
          >
            <ModalContainer>
              <InputAndTitle title="팀 이름">
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="팀 이름을 입력하세요"
                />
              </InputAndTitle>

              <InputAndTitle title="팀 설명">
                <Input
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="팀에 대한 설명을 입력하세요"
                />
              </InputAndTitle>

              <div className="modal-actions">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTeamModal(false)}
                >
                  취소
                </Button>
                <Button
                  variant="flat"
                  onClick={handleCreateTeam}
                  isLoading={isCreatingTeam}
                  disabled={isCreatingTeam}
                >
                  팀 생성
                </Button>
              </div>
            </ModalContainer>
          </Modal>
        </>
      )}
    </PageContainer>
  );
}

// 커스텀 컴포넌트 및 스타일
const PageContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 100px;
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background-color: var(--white);
  padding: 1.5rem;
  border-radius: 10px;

  .help-text {
    color: var(--grey-500);
    margin-bottom: 1rem;
  }

  button {
    align-self: flex-start;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  background-color: var(--white);
  border-radius: 10px;
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
`;

const TeamCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 10px;
  background-color: var(--white);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .team-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .team-card-header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  .team-date {
    color: var(--grey-500);
    white-space: nowrap;
  }

  .team-description {
    color: var(--grey-600);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--grey-200);
  }

  .members-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .members-title {
    font-weight: 600;
  }

  .team-select {
    width: 100%;
  }
`;

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  background-color: var(--white);
  border-radius: 10px;

  .empty-state-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;
  }
`;

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .modal-actions {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
`;
