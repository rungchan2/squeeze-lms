"use client";

import styled from "@emotion/styled";
import { useOrganizationUsers } from "@/hooks/useUsers";
import { Table } from "@chakra-ui/react";
import { useAuth } from "@/components/AuthProvider";
import Text from "@/components/Text/Text";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Button from "@/components/common/Button";
import { ProfileImage } from "@/components/navigation/ProfileImage";
import Select from "react-select";
import { useOrganization } from "@/hooks/useOrganization";
import { toaster } from "@/components/ui/toaster";
import { createNotification } from "@/hooks/useNotification";
import { fetchJourneyDetail } from "@/hooks/useJourney";
import { useParams } from "next/navigation";
export default function UsersPage() {
  const router = useRouter();
  const { organizationId, role } = useAuth();
  const { slug } = useParams();
  const uuid = slug as string;
  useEffect(() => {
    if (!organizationId || role === "user") {
      toaster.create({
        title: "권한이 없습니다.",
        type: "error",
      });
      router.push("/");
    }
  }, [organizationId, router, role]);
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
      link: `journey/${uuid}/redirect/invite`,
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
      //TODO: 초대 이메일 보내기
    }
  };

  const { users } = useOrganizationUsers(organizationId ?? 0);
  return (
    <Container>
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
            <Table.ColumnHeader textAlign="center">프로필</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">이름</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">역할</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">초대</Table.ColumnHeader>
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
              <Table.Cell >
                {user.first_name + " " + user.last_name}
              </Table.Cell>
              <Table.Cell >{user.role}</Table.Cell>
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

//TODO: 클라스 멤버 목록 조회
