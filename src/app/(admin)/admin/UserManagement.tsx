import { useState } from "react";
import { useAllUsers } from "@/hooks/useUsers";
import { Table, Button, Stack, Badge } from "@chakra-ui/react";
import { FaDownload } from "react-icons/fa";
import Text from "@/components/Text/Text";
import BulkUserCreationModal from "./BulkUserCreationModal";

export default function UserManagement() {
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const { users, isLoading, loadMore, isLoadingMore, isReachingEnd, total, mutate } = useAllUsers(20);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'teacher':
        return 'blue';
      case 'user':
      default:
        return 'gray';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'teacher':
        return '교사';
      case 'user':
      default:
        return '학생';
    }
  };

  const handleBulkCreateSuccess = () => {
    mutate(); // Refresh user list
    setIsBulkCreateOpen(false);
  };

  return (
    <Stack direction="column" marginTop={4}>
      <Stack direction="row" justify="space-between" marginBottom={4}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Text variant="body" fontWeight="bold">회원 관리</Text>
          <Badge colorScheme="blue" variant="subtle">
            총 {total}명
          </Badge>
        </Stack>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => setIsBulkCreateOpen(true)}
        >
          <Stack direction="row" alignItems="center">
            <FaDownload />
            <span>CSV로 사용자 추가</span>
          </Stack>
        </Button>
      </Stack>
      
      <Table.Root size="sm" variant="outline" backgroundColor="var(--white)">
        <Table.ColumnGroup>
          <Table.Column htmlWidth="25%" />
          <Table.Column htmlWidth="15%" />
          <Table.Column htmlWidth="15%" />
          <Table.Column htmlWidth="25%" />
          <Table.Column htmlWidth="10%" />
          <Table.Column htmlWidth="10%" />
        </Table.ColumnGroup>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>이메일</Table.ColumnHeader>
            <Table.ColumnHeader>이름</Table.ColumnHeader>
            <Table.ColumnHeader>전화번호</Table.ColumnHeader>
            <Table.ColumnHeader>소속</Table.ColumnHeader>
            <Table.ColumnHeader>역할</Table.ColumnHeader>
            <Table.ColumnHeader>가입일</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users?.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>
                {user.first_name} {user.last_name}
              </Table.Cell>
              <Table.Cell>{user.phone || '-'}</Table.Cell>
              <Table.Cell>
                <Text variant="caption" color="var(--grey-600)">
                  {user.organization_id ? '조직 ID: ' + user.organization_id.slice(0, 8) + '...' : '-'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Badge colorScheme={getRoleColor(user.role || 'user')} variant="subtle">
                  {getRoleLabel(user.role || 'user')}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Text variant="caption" color="var(--grey-600)">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </Text>
              </Table.Cell>
            </Table.Row>
          ))}
          {users?.length === 0 && !isLoading && (
            <Table.Row>
              <Table.Cell colSpan={6} textAlign="center">
                등록된 회원이 없습니다
              </Table.Cell>
            </Table.Row>
          )}
          {isLoading && (
            <Table.Row>
              <Table.Cell colSpan={6} textAlign="center">
                로딩 중...
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>

      {!isReachingEnd && (
        <Stack direction="row" justifyContent="center" marginTop={4}>
          <Button
            size="sm"
            variant="outline"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "로딩 중..." : "더 보기"}
          </Button>
        </Stack>
      )}

      <BulkUserCreationModal
        isOpen={isBulkCreateOpen}
        onClose={() => setIsBulkCreateOpen(false)}
        onSuccess={handleBulkCreateSuccess}
      />
    </Stack>
  );
}