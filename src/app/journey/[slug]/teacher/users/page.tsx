"use client";

import styled from "@emotion/styled";
import { useOrganizationUsers } from "@/hooks/useUsers";
import { Flex, Table } from "@chakra-ui/react";
import { useAuth } from "@/components/AuthProvider";
import Text from "@/components/Text/Text";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Button from "@/components/common/Button";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import Select from "react-select";
import { useOrganizationList } from "@/hooks/useOrganization";
import { toaster } from "@/components/ui/toaster";
import { createNotification } from "@/hooks/useNotification";
import { fetchJourneyDetail } from "@/hooks/useJourney";
import { useParams } from "next/navigation";
import { useJourneyStore } from "@/store/journey";
import { useJourneyUser } from "@/hooks/useJourneyUser";
import { Tabs } from "@chakra-ui/react";
import { LuFolder, LuUser } from "react-icons/lu";
import Heading from "@/components/Text/Heading";
import { deleteUserFromJourney } from "@/app/journey/actions";
import Footer from "@/components/common/Footer";
import { createClient } from "@/utils/supabase/client";
import { sendEmail } from "@/utils/edge-functions/email";

export default function UsersPage() {
  const { currentJourneyId } = useJourneyStore();
  const router = useRouter();
  const { organizationId, role } = useAuth();
  const { slug } = useParams();
  const uuid = slug as string;
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number>(
    organizationId ?? 0
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<number[]>([]);
  const [invitingUsers, setInvitingUsers] = useState<number[]>([]);
  const {
    users = [],
    loadMore,
    isLoadingMore = false,
    isReachingEnd = false,
    total = 0,
  } = useOrganizationUsers(selectedOrganizationId ?? 0);

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
      router.push("/");
    }
  }, [router, slug]);

  // URL의 slug로부터 직접 여정 정보 불러오기
  useEffect(() => {
    const loadJourneyData = async () => {
      try {
        // 여정 UUID 설정은 별도의 useEffect로 분리

        // 2. Journey ID 불러오기 - 이미 로드된 경우 다시 로드하지 않음
        if (currentJourneyId) {
          setIsLoading(false);
          return;
        }

        if (!currentJourneyId) {
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
  }, [organizationId, role, router, currentJourneyId, goBackOrHome]);

  // 현재 여정 ID가 설정된 후에만 여정 사용자 불러오기
  const { currentJourneyUsers = [] } = useJourneyUser(currentJourneyId ?? 0);

  // 현재 여정에 이미 참여 중인 사용자 ID 목록
  const currentMemberIds = useMemo(
    () => currentJourneyUsers?.map((user) => user?.id).filter(Boolean) || [],
    [currentJourneyUsers]
  );

  // useOrganizationList 직접 불러오기
  const { organizations = [], isLoading: orgsLoading } = useOrganizationList();

  const organizationOptions =
    organizations?.map((organization) => ({
      label: organization?.name || "알 수 없음",
      value: organization?.id || 0,
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
          .filter((id): id is number => id !== null);
        setInvitedUsers(invitedUserIds);
      } catch (error) {
        console.error("초대 목록 불러오기 실패:", error);
      }
    };

    fetchInvitedUsers();
  }, [uuid]);

  // 초대 상태 체크 함수
  const isUserInvited = useCallback(
    (userId: number) => {
      if (!userId) return false;
      // 이미 멤버인 경우
      if (currentMemberIds.includes(userId)) {
        return true;
      }
      // 초대된 경우
      return invitedUsers.includes(userId);
    },
    [currentMemberIds, invitedUsers]
  );

  // 초대 버튼 텍스트 표시
  const getInviteButtonText = useCallback(
    (userId: number) => {
      if (!userId) return "초대";
      if (invitingUsers.includes(userId)) {
        return "로딩...";
      }
      if (currentMemberIds.includes(userId)) {
        return "멤버";
      }
      if (invitedUsers.includes(userId)) {
        return "초대됨";
      }
      return "초대";
    },
    [currentMemberIds, invitedUsers, invitingUsers]
  );

  const handleInvite = async (userId: number, email: string) => {
    if (!userId) return;
    // 이미 멤버이거나 처리 중인 사용자는 무시
    if (
      currentMemberIds.includes(userId) ||
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
          `${journey.name}에 초대되었습니다.`,
          `<div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #f0f0f0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
              <img src="${window.location.origin}/logo.png" alt="스퀴즈 로고" style="height: 40px; margin-bottom: 10px;" />
              <h1 style="color: #333; font-size: 24px; margin: 0;">클라스 초대</h1>
            </div>
            
            <div style="margin-bottom: 30px; text-align: center; line-height: 1.6;">
              <p style="font-size: 16px; color: #333; margin-bottom: 16px;">안녕하세요, <strong>${journey.name}</strong>에 초대되었습니다.</p>
              <p style="font-size: 16px; color: #333; margin-bottom: 25px;">아래 버튼을 클릭하여 여정에 참여해주세요.</p>
              
              <a href="${window.location.origin}/journey/${uuid}/redirect/invite" 
                 style="display: inline-block; padding: 12px 24px; background-color: #6366F1; color: white; text-decoration: none; font-weight: 500; border-radius: 6px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);">
                ${journey.name} 시작하기
              </a>
            </div>
            
            <div style="color: #888; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              <p>이 메일은 발신 전용이며, 문의사항은 웹사이트를 통해 문의해주세요.</p>a
              <p>© ${new Date().getFullYear()} 스퀴즈. All rights reserved.</p>
            </div>
          </div>`
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

  const handleKick = async (userId: number) => {
    const { error } = await deleteUserFromJourney(
      currentJourneyId ?? 0,
      userId
    );
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
      <Tabs.Root defaultValue="members" variant="outline">
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
              <Table.Root size="sm" interactive showColumnBorder>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader textAlign="center">
                      프로필
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">
                      이름
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">
                      역할
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">
                      초대
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
                          />
                        </Table.Cell>
                        <Table.Cell>
                          {(user?.first_name || "") +
                            " " +
                            (user?.last_name || "")}
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
                                handleKick(user?.id ?? 0);
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
                  setSelectedOrganizationId(value?.value ?? 0);
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
                    <Table.ColumnHeader textAlign="center">
                      프로필
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">
                      이름
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">
                      역할
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">
                      초대
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
                          />
                        </Table.Cell>
                        <Table.Cell>
                          {(user.first_name || "") +
                            " " +
                            (user.last_name || "")}
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
//TODO: 1. 전반적인 페이지 권한 및 라우팅 설정
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
