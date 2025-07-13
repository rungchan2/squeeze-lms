"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import { useOrganizationUsers } from "@/hooks/useUsers";
import { Flex, Table } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import Select from "react-select";
import { useOrganizationList } from "@/hooks/useOrganization";
import { toaster } from "@/components/ui/toaster";
import { createNotification } from "@/hooks/useNotification";
import { fetchJourneyDetail } from "@/hooks/useJourney";
import { useParams } from "next/navigation";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import { Tabs } from "@chakra-ui/react";
import { LuFolder, LuUser } from "react-icons/lu";
import Heading from "@/components/Text/Heading";
import { deleteUserFromJourney } from "@/utils/data/userJourney";
import Footer from "@/components/common/Footer";
import { createClient } from "@/utils/supabase/client";
import { sendEmail } from "@/utils/edge-functions/email";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { mailBody } from "./mailBody";

export default function UsersPage() {
  const router = useRouter();
  const { organizationId, role } = useSupabaseAuth();
  const { slug } = useParams();
  const uuid = slug as string;
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>(
    organizationId && organizationId !== "undefined" && organizationId !== "null" 
      ? organizationId 
      : ""
  );
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [invitingUsers, setInvitingUsers] = useState<string[]>([]);
  const {
    users = [],
    loadMore,
    isLoadingMore = false,
    isReachingEnd = false,
    total = 0,
    mutate,
  } = useOrganizationUsers(selectedOrganizationId || "");
  
  useEffect(() => {
    if (mutate) {
      mutate();
    }
  }, [selectedOrganizationId, mutate]);

  // 권한 없을 때 뒤로 가거나 홈으로 가는 함수
  const goBackOrHome = useCallback(() => {
    try {
      router.back();
      setTimeout(() => {
        if (window.location.pathname.includes(`/journey/${slug}/users`)) {
          router.push("/");
        }
      }, 1000);
    } catch (err) {
      console.error("뒤로 가기 오류:", err);
      router.push("/");
    }
  }, [router, slug]);

  // URL의 slug로부터 직접 여정 정보 불러오기
  useEffect(() => {
    const loadJourneyData = async () => {
      try {
        // 여정 UUID 설정은 별도의 useEffect로 분리

        // 2. Journey ID 불러오기 - 이미 로드된 경우 다시 로드하지 않음
        if (slug) {
          setIsLoading(false);
          return;
        }

        if (!slug) {
          setIsLoading(false);
          toaster.create({
            title: "여정 정보를 불러올 수 없습니다.",
            type: "error",
          });
          goBackOrHome();
          return;
        }

        // 권한 체크
        if (!organizationId || role === "user") {
          setIsLoading(false);
          toaster.create({
            title: "권한이 없습니다.",
            type: "error",
          });
          goBackOrHome();
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error("여정 데이터 로드 오류:", error);
        setIsLoading(false);
        toaster.create({
          title: "여정 정보를 불러오는 중 오류가 발생했습니다.",
          type: "error",
        });
        goBackOrHome();
      }
    };

    loadJourneyData();
  }, [organizationId, role, router, slug, goBackOrHome]);

  // 현재 여정 ID가 설정된 후에만 여정 사용자 불러오기
  const { currentJourneyUsers = [], revalidate: revalidateJourneyUsers } = useJourneyUser(uuid ?? "");

  // 현재 여정에 이미 참여 중인 사용자 ID 목록
  const currentMemberIds = useMemo(
    () => currentJourneyUsers?.map((user) => user?.id).filter(Boolean) || [],
    [currentJourneyUsers]
  );
  
  // 로컬 상태로 멤버 ID 관리 (초기값은 currentMemberIds)
  const [localMemberIds, setLocalMemberIds] = useState<string[]>([]);
  
  // currentMemberIds가 변경될 때만 localMemberIds 업데이트
  useEffect(() => {
    // 배열 내용 비교를 통해 실제로 변경되었을 때만 상태 업데이트
    const isDifferent = 
      localMemberIds.length !== currentMemberIds.length || 
      currentMemberIds.some(id => !localMemberIds.includes(id));
    
    if (isDifferent) {
      setLocalMemberIds(currentMemberIds);
    }
  }, [currentMemberIds]);

  // useOrganizationList 직접 불러오기
  const { organizations = [], isLoading: orgsLoading } = useOrganizationList();

  const organizationOptions =
    organizations?.map((organization) => ({
      label: organization?.name || "알 수 없음",
      value: organization?.id || "",
    })) || [];

  // 초대된 사용자 목록 불러오기
  useEffect(() => {
    const fetchInvitedUsers = async () => {
      if (!uuid) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("notifications")
          .select("receiver_id")
          .eq("type", "request")
          .like("link", `%/journey/${uuid}/redirect/invite%`);

        if (error) {
          console.error("초대 목록 조회 오류:", error);
          return;
        }

        // 초대된 사용자 ID 목록 추출 - null 값 필터링
        const invitedUserIds = data
          .map((item) => item.receiver_id)
          .filter((id): id is string => id !== null);
        setInvitedUsers(invitedUserIds);
      } catch (error) {
        console.error("초대 목록 불러오기 실패:", error);
      }
    };

    fetchInvitedUsers();
  }, [uuid]);

  // 초대 상태 체크 함수
  const isUserInvited = useCallback(
    (userId: string) => {
      if (!userId) return false;
      // 이미 멤버인 경우 (localMemberIds 사용)
      if (localMemberIds.includes(userId)) {
        return true;
      }
      // 초대된 경우
      return invitedUsers.includes(userId);
    },
    [localMemberIds, invitedUsers]
  );

  // 초대 버튼 텍스트 표시
  const getInviteButtonText = useCallback(
    (userId: string) => {
      if (!userId) return "초대";
      if (invitingUsers.includes(userId)) {
        return "로딩...";
      }
      if (localMemberIds.includes(userId)) {
        return "멤버";
      }
      if (invitedUsers.includes(userId)) {
        return "초대됨";
      }
      return "초대";
    },
    [localMemberIds, invitedUsers, invitingUsers]
  );

  const handleInvite = async (userId: string, email: string) => {
    if (!userId) return;
    // 이미 멤버이거나 처리 중인 사용자는 무시
    if (
      localMemberIds.includes(userId) ||
      invitingUsers.includes(userId) ||
      invitedUsers.includes(userId)
    ) {
      return;
    }

    try {
      // 처리 중 상태 설정
      setInvitingUsers((prev) => [...prev, userId]);

      const { data: journey } = await fetchJourneyDetail(uuid);
      if (!journey) {
        toaster.create({
          title: "여정 정보를 불러올 수 없습니다.",
          type: "error",
        });
        return;
      }

      const { error } = await createNotification({
        receiver_id: userId,
        type: "request",
        message: `${journey.name || "새 클라스"}에 초대되었습니다.`,
        link: `/journey/${uuid}/redirect/invite`,
      });
      if (error) {
        toaster.create({
          title: "초대 실패",
          type: "error",
        });
      } else {
        // 초대 성공 시 초대된 사용자 목록에 추가
        setInvitedUsers((prev) => [...prev, userId]);

        const { error } = await sendEmail(
          email ?? "",
          `[스퀴즈!]${journey.name}에 초대되었습니다.`,
          mailBody(journey.name, uuid),
          userId
        );
        if (error) {
          toaster.create({
            title: "초대 이메일 보내기 실패",
            type: "error",
          });
        } else {
          toaster.create({
            title: "초대 완료",
            type: "success",
          });
        }
      }
    } catch (error) {
      console.error("초대 처리 중 오류:", error);
      toaster.create({
        title: "초대 실패",
        type: "error",
      });
    } finally {
      // 처리 중 상태 해제
      setInvitingUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  // 사용자를 바로 추가하는 함수
  const handleDirectAdd = async (userId: string) => {
    // 이미 멤버이거나 처리 중인 사용자는 무시
    if (localMemberIds.includes(userId)) {
      toaster.create({
        title: "이미 클라스 멤버입니다",
        type: "info",
      });
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_journeys")
        .insert({ 
          user_id: userId, 
          journey_id: uuid, 
          role_in_journey: "user",
          joined_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("사용자 추가 실패:", error);
        toaster.create({
          title: "사용자 추가 실패",
          type: "error",
        });
      } else {
        // 성공 메시지 표시
        toaster.create({
          title: "사용자가 클라스에 추가되었습니다",
          type: "success",
        });
        
        // 로컬 상태 즉시 업데이트
        setLocalMemberIds(prev => [...prev, userId]);
        
        // 서버 데이터 다시 불러오기
        revalidateJourneyUsers();
      }
    } catch (error) {
      console.error("사용자 추가 중 오류:", error);
      toaster.create({
        title: "사용자 추가 실패",
        type: "error",
      });
    }
  };

  const handleKick = async (userId: string) => {
    const { error } = await deleteUserFromJourney(uuid ?? "", userId);
    if (error) {
      toaster.create({
        title: "강퇴 실패",
        type: "error",
      });
    } else {
      toaster.create({
        title: "강퇴 완료",
        type: "success",
      });
    }
  };

  // 무한 스크롤을 위한 Intersection Observer 설정
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      loadMoreRef.current = node;

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isReachingEnd) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoadingMore, isReachingEnd, loadMore]
  );

  // 다음 페이지 직접 로드 처리
  const handleLoadMore = () => {
    if (!isReachingEnd && !isLoadingMore) {
      loadMore();
    }
  };

  // 로딩 중이거나 권한 체크 중이면 컨텐츠를 렌더링하지 않음
  if (isLoading || orgsLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <Container>
      <Tabs.Root defaultValue="members" variant="line">
        <Tabs.List bg="bg.muted" rounded="l3" p="1">
          <Tabs.Trigger value="members">
            <LuUser />
            클라스 멤버
          </Tabs.Trigger>
          <Tabs.Trigger value="projects">
            <LuFolder />
            전체 유저
          </Tabs.Trigger>
          <Tabs.Indicator rounded="l2" />
        </Tabs.List>
        <Tabs.Content value="members">
          <Flex flexDirection="column" gap="16px">
            <Heading level={3}>클라스 멤버</Heading>
            <TableContainer>
              <Table.Root size="sm" interactive >
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader >
                      프로필
                    </Table.ColumnHeader>
                    <Table.ColumnHeader >
                      이름
                    </Table.ColumnHeader>
                    <Table.ColumnHeader >
                      역할
                    </Table.ColumnHeader>
                    <Table.ColumnHeader >
                      강퇴
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {currentJourneyUsers && currentJourneyUsers.length > 0 ? (
                    currentJourneyUsers.map((user) => (
                      <Table.Row key={user?.id || "unknown"}>
                        <Table.Cell
                          verticalAlign="middle"
                          justifyContent="center"
                          alignContent="center"
                        >
                          <ProfileImage
                            profileImage={user?.profile_image ?? null}
                            width={32}
                            size="small"
                            id={user?.id}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          {(user?.last_name || "")+
                            (user?.first_name || "")}
                        </Table.Cell>
                        <Table.Cell>{user?.role || "일반"}</Table.Cell>
                        <Table.Cell justifyContent="center">
                          <Button
                            style={{
                              maxWidth: "100px",
                              borderColor: "var(--negative-600)",
                              color: "var(--negative-600)",
                            }}
                            variant="outline"
                            onClick={() => {
                              if (
                                confirm("정말로 이 유저를 강퇴하시겠습니까?")
                              ) {
                                handleKick(user?.id ?? "");
                              }
                            }}
                            disabled={!user?.id}
                          >
                            강퇴
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan={4} textAlign="center">
                        클라스 멤버가 없습니다
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
            </TableContainer>
          </Flex>
        </Tabs.Content>
        <Tabs.Content value="projects">
          {/* 클라스 멤버 목록 */}

          <Flex flexDirection="column" gap="16px">
            <Heading level={3}>전체 유저</Heading>
            {organizationOptions.length > 0 ? (
              <Select
                options={organizationOptions}
                defaultValue={organizationOptions?.find(
                  (option) => option.value === organizationId
                )}
                isDisabled={role === "teacher" || role === "user"}
                onChange={(value) => {
                  // 조직 ID 검증 및 설정
                  const selectedOrgId = value?.value && value.value !== "undefined" && value.value !== "null" ? 
                    String(value.value) : "";
                  
                  // 이전 값과 같으면 변경하지 않음
                  if (selectedOrgId === selectedOrganizationId) {
                    return;
                  }
                  
                  setSelectedOrganizationId(selectedOrgId);
                }}
              />
            ) : (
              <Text variant="caption" style={{ textAlign: "center" }}>
                사용 가능한 조직이 없습니다
              </Text>
            )}
            <TableContainer>
              <Table.Root size="sm" interactive showColumnBorder>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>
                      프로필
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>
                      이름
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>
                      역할
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>
                      초대
                    </Table.ColumnHeader>
                    <Table.ColumnHeader>
                      바로추가
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {users && users.length > 0 ? (
                    users.map((user, index) => (
                      <Table.Row key={user.id || `user-${index}`}>
                        <Table.Cell
                          verticalAlign="middle"
                          justifyContent="center"
                          alignContent="center"
                        >
                          <ProfileImage
                            profileImage={user.profile_image || null}
                            width={32}
                            size="small"
                            id={user?.id}
                          />
                        </Table.Cell>
                        <Table.Cell>
                          {(user.last_name || "")+
                            (user.first_name || "")}
                        </Table.Cell>
                        <Table.Cell>{user.role || "일반"}</Table.Cell>
                        <Table.Cell justifyContent="center">
                          <Button
                            style={{
                              maxWidth: "100px",
                              alignSelf: "center",
                              opacity: isUserInvited(user.id) ? 0.6 : 1,
                            }}
                            variant={
                              isUserInvited(user.id) ? "flat" : "outline"
                            }
                            onClick={() => handleInvite(user.id, user.email)}
                            disabled={
                              !user.id ||
                              isUserInvited(user.id) ||
                              invitingUsers.includes(user.id)
                            }
                          >
                            {getInviteButtonText(user.id)}
                          </Button>
                          
                        </Table.Cell>
                        <Table.Cell width="fit-content">
                        <Button
                            style={{
                              maxWidth: "100px", 
                              alignSelf: "center",
                              marginLeft: "8px",
                              backgroundColor: "var(--primary-600)",
                              color: "white",
                            }}
                            variant="flat"
                            onClick={() => handleDirectAdd(user.id)}
                            disabled={
                              !user.id ||
                              localMemberIds.includes(user.id)
                            }
                          >
                            바로추가
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell colSpan={4} textAlign="center">
                        사용자가 없습니다
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
            </TableContainer>
            {!isReachingEnd && users.length > 0 && (
              <div
                ref={lastElementRef}
                style={{ height: "20px", margin: "10px 0" }}
              >
                {isLoadingMore && (
                  <div style={{ textAlign: "center" }}>로딩 중...</div>
                )}
              </div>
            )}
            {users.length > 0 && (
              <Flex flexDirection="column" gap="8px" alignItems="center">
                <Text variant="caption">
                  {users.length}명 / 총 {total}명
                </Text>
                {!isReachingEnd && (
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    style={{ maxWidth: "200px" }}
                  >
                    {isLoadingMore ? "로딩 중..." : "더 보기"}
                  </Button>
                )}
              </Flex>
            )}
          </Flex>
        </Tabs.Content>
      </Tabs.Root>
      <Footer />
    </Container>
  );
}

const Container = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TableContainer = styled.div`
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
`;
