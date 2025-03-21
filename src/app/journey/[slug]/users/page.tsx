"use client";

import styled from "@emotion/styled";
import { useOrganizationUsers } from "@/hooks/useUsers";
import { Flex, Table } from "@chakra-ui/react";
import { useAuth } from "@/components/AuthProvider";
import Text from "@/components/Text/Text";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import Select from "react-select";
import { useOrganization } from "@/hooks/useOrganization";
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

export default function UsersPage() {
  const { currentJourneyId, getCurrentJourneyId, setCurrentJourneyUuid } =
    useJourneyStore();
  const router = useRouter();
  const { organizationId, role } = useAuth();
  const { slug } = useParams();
  const uuid = slug as string;
  const [isLoading, setIsLoading] = useState(true);

  // 권한 없을 때 뒤로 가거나 홈으로 가는 함수
  const goBackOrHome = () => {
    try {
      // 뒤로 가기 시도
      router.back();
      
      // 만약 뒤로 가기가 불가능하면(직접 URL 접근 등) 1초 후 홈으로 리다이렉션
      setTimeout(() => {
        // 현재 URL이 여전히 같은 페이지라면 홈으로 리다이렉션
        if (window.location.pathname.includes(`/journey/${slug}/users`)) {
          router.push('/');
        }
      }, 1000);
    } catch (e) {
      // 오류 발생 시 홈으로 리다이렉션
      router.push('/');
    }
  };

  // URL의 slug로부터 직접 여정 정보 불러오기
  useEffect(() => {
    const loadJourneyData = async () => {
      try {
        // 1. UUID 저장 (이렇게 하면 getCurrentJourneyId에서 사용됨)
        setCurrentJourneyUuid(uuid);

        // 2. Journey ID 불러오기
        const journeyId = await getCurrentJourneyId();

        if (!journeyId) {
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
  }, [
    uuid,
    organizationId,
    role,
    router,
    getCurrentJourneyId,
    setCurrentJourneyUuid,
  ]);

  // 현재 여정 ID가 설정된 후에만 여정 사용자 불러오기
  const { currentJourneyUsers } = useJourneyUser(currentJourneyId ?? 0);

  const {
    data: { useOrganizationList },
  } = useOrganization();
  const { organizations } = useOrganizationList();
  const organizationOptions = organizations?.map((organization) => ({
    label: organization.name,
    value: organization.id,
  }));

  const handleInvite = async (userId: number) => {
    const { data: journey } = await fetchJourneyDetail(uuid);
    const { error } = await createNotification({
      receiver_id: userId,
      type: "request",
      message: `${journey.name}에 초대되었습니다.`,
      link: `/journey/${uuid}/redirect/invite`,
    });
    if (error) {
      toaster.create({
        title: "초대 실패",
        type: "error",
      });
    } else {
      toaster.create({
        title: "초대 완료",
        type: "success",
      });
      //TODO: 2. 초대 이메일 보내기
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

  const { users } = useOrganizationUsers(organizationId ?? 0);

  // 로딩 중이거나 권한 체크 중이면 컨텐츠를 렌더링하지 않음
  if (isLoading) {
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
                {currentJourneyUsers?.map((user) => (
                  <Table.Row key={user?.id}>
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
                      {user?.first_name + " " + user?.last_name}
                    </Table.Cell>
                    <Table.Cell>{user?.role}</Table.Cell>
                    <Table.Cell justifyContent="center">
                      <Button
                        style={{
                          maxWidth: "100px",
                          borderColor: "var(--negative-600)",
                          color: "var(--negative-600)",
                        }}
                        variant="outline"
                        onClick={() => {
                          if (confirm("정말로 이 유저를 강퇴하시겠습니까?")) {
                            handleKick(user?.id ?? 0);
                          }
                        }}
                      >
                        강퇴
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Flex>
        </Tabs.Content>
        <Tabs.Content value="projects">
          {/* 클라스 멤버 목록 */}
          <Flex flexDirection="column" gap="16px">
            <Heading level={3}>전체 유저</Heading>
            <Select
              options={organizationOptions}
              defaultValue={organizationOptions?.find(
                (option) => option.value === organizationId
              )}
              isDisabled={role === "teacher"}
            />
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
                {users.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell
                      verticalAlign="middle"
                      justifyContent="center"
                      alignContent="center"
                    >
                      <ProfileImage
                        profileImage={user.profile_image}
                        width={32}
                        size="small"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {user.first_name + " " + user.last_name}
                    </Table.Cell>
                    <Table.Cell>{user.role}</Table.Cell>
                    <Table.Cell justifyContent="center">
                      <Button
                        style={{ maxWidth: "100px", alignSelf: "center" }}
                        variant="outline"
                        onClick={() => handleInvite(user.id)}
                      >
                        초대
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Flex>
        </Tabs.Content>
      </Tabs.Root>
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
