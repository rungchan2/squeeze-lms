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
export default function UsersPage() {
  const router = useRouter();
  const { organizationId, role } = useAuth();
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

  const { users } = useOrganizationUsers(organizationId ?? 0);
  return (
    <Container>
      <Select
        options={organizationOptions}
        defaultValue={organizationOptions?.find(
          (option) => option.value === organizationId
        )}
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
                textAlign="center"
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
              <Table.Cell>{user.first_name + " " + user.last_name}</Table.Cell>
              <Table.Cell textAlign="end">{user.role}</Table.Cell>
              <Table.Cell textAlign="end">
                <Button variant="outline">초대</Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

//TODO: 클라스 멤버 목록 조회
