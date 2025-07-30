import { useState, useEffect, useRef, useMemo } from "react";
import { useAllUsers } from "@/hooks/useUsers";
import { Table, Button, Stack, Badge, Input } from "@chakra-ui/react";
import { FaDownload, FaSearch, FaFilter, FaUsers, FaEye } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import Text from "@/components/Text/Text";
import BulkUserCreationModal from "./BulkUserCreationModal";
import styled from "@emotion/styled";
import { Modal } from "@/components/modal/Modal";
import { createClient } from "@/utils/supabase/client";

// 사용자 상세 정보 모달 컴포넌트
const UserDetailModal = ({ 
  isOpen, 
  onClose, 
  user 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  user: any | null; 
}) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <DetailModalContent>
        <Stack direction="row" justify="space-between" align="center">
          <Text variant="body" fontWeight="bold" style={{ fontSize: "20px" }}>
            사용자 상세 정보
          </Text>
          <Badge colorScheme={getRoleColor(user.role || 'user')} variant="subtle">
            {getRoleLabel(user.role || 'user')}
          </Badge>
        </Stack>

        <UserInfoGrid>
          <UserInfoRow>
            <UserInfoKey>이메일</UserInfoKey>
            <UserInfoValue>{user.email}</UserInfoValue>
          </UserInfoRow>
          <UserInfoRow>
            <UserInfoKey>이름</UserInfoKey>
            <UserInfoValue>{user.first_name} {user.last_name}</UserInfoValue>
          </UserInfoRow>
          <UserInfoRow>
            <UserInfoKey>전화번호</UserInfoKey>
            <UserInfoValue>{user.phone || '정보 없음'}</UserInfoValue>
          </UserInfoRow>
          <UserInfoRow>
            <UserInfoKey>소속 ID</UserInfoKey>
            <UserInfoValue>{user.organization_id || '정보 없음'}</UserInfoValue>
          </UserInfoRow>
          <UserInfoRow>
            <UserInfoKey>가입일</UserInfoKey>
            <UserInfoValue>
              {user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : '정보 없음'}
            </UserInfoValue>
          </UserInfoRow>
          <UserInfoRow>
            <UserInfoKey>마케팅 수신</UserInfoKey>
            <UserInfoValue>{user.marketing_opt_in ? '동의' : '미동의'}</UserInfoValue>
          </UserInfoRow>
          <UserInfoRow>
            <UserInfoKey>개인정보 동의</UserInfoKey>
            <UserInfoValue>{user.privacy_agreed ? '동의' : '미동의'}</UserInfoValue>
          </UserInfoRow>
        </UserInfoGrid>

        <Stack direction="row" justifyContent="flex-end" marginTop={4}>
          <Button size="sm" variant="outline" onClick={onClose}>
            닫기
          </Button>
        </Stack>
      </DetailModalContent>
    </Modal>
  );
};

// 역할 관련 헬퍼 함수들을 컴포넌트 외부로 이동
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

export default function UserManagement() {
  console.log('[UserManagement] Component rendering');
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  
  const { users, isLoading, loadMore, isLoadingMore, isReachingEnd, total, mutate } = useAllUsers(20);
  const observerRef = useRef<HTMLDivElement>(null);

  // 필터링된 사용자 목록
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = users.filter(user => {
      const matchesSearch = searchTerm === "" || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);
      
      const matchesRole = roleFilter === "" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          break;
        case "email":
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case "role":
          aValue = a.role || 'user';
          bValue = b.role || 'user';
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [users, searchTerm, roleFilter, sortBy, sortOrder]);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore && !isReachingEnd) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '20px',
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [isLoadingMore, isReachingEnd, loadMore]);

  const handleBulkCreateSuccess = () => {
    mutate(); // Refresh user list
    setIsBulkCreateOpen(false);
  };

  const handleUserDetail = (user: any) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const handleRefresh = () => {
    mutate();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdatingRole(userId);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as "user" | "teacher" | "admin" })
        .eq('id', userId);

      if (error) {
        console.error('Error updating role:', error);
        alert(`권한 변경에 실패했습니다: ${error.message}`);
      } else {
        alert('사용자 권한이 성공적으로 변경되었습니다.');
        mutate(); // Refresh user list
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert('권한 변경 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingRole(null);
    }
  };

  return (
    <AdminContainer>
      {/* 헤더 영역 */}
      <HeaderSection>
        <HeaderInfo>
          <Stack direction="row" alignItems="center" gap={2}>
            <FaUsers size={20} color="var(--primary-600)" />
            <Text variant="body" fontWeight="bold" style={{ fontSize: "18px" }}>회원 관리</Text>
          </Stack>
          <StatsGrid>
            <StatCard>
              <StatValue>{total}</StatValue>
              <StatLabel>전체 회원</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{filteredUsers.length}</StatValue>
              <StatLabel>검색 결과</StatLabel>
            </StatCard>
          </StatsGrid>
        </HeaderInfo>
        
        <ActionButtons>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <LuRefreshCw />
            새로고침
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => setIsBulkCreateOpen(true)}
          >
            <FaDownload />
            CSV로 사용자 추가
          </Button>
        </ActionButtons>
      </HeaderSection>

      {/* 검색 및 필터 영역 */}
      <FilterSection>
        <SearchBar>
          <SearchInput>
            <FaSearch color="var(--grey-400)" />
            <Input
              placeholder="이메일, 이름, 전화번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="subtle"
              style={{ border: 'none', boxShadow: 'none' }}
            />
          </SearchInput>
        </SearchBar>
        
        <FilterControls>
          <FilterGroup>
            <FilterLabel>
              <FaFilter size={12} />
              역할
            </FilterLabel>
            <select 
              value={roleFilter}
              onChange={(e) => {
                const newValue = e.target.value || "";
                console.log('[UserManagement] RoleFilter onChange (HTML):', newValue);
                setRoleFilter(newValue);
              }}
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--grey-300)',
                fontSize: '14px',
                width: '120px'
              }}
            >
              <option value="">전체</option>
              <option value="user">학생</option>
              <option value="teacher">교사</option>
              <option value="admin">관리자</option>
            </select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>정렬</FilterLabel>
            <select 
              value={sortBy}
              onChange={(e) => {
                const newValue = e.target.value || "created_at";
                console.log('[UserManagement] SortBy onChange (HTML):', newValue);
                setSortBy(newValue);
              }}
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--grey-300)',
                fontSize: '14px',
                width: '120px'
              }}
            >
              <option value="created_at">가입일</option>
              <option value="name">이름</option>
              <option value="email">이메일</option>
              <option value="role">역할</option>
            </select>
          </FilterGroup>

          <FilterGroup>
            <select 
              value={sortOrder}
              onChange={(e) => {
                const newValue = (e.target.value || "desc") as "asc" | "desc";
                console.log('[UserManagement] SortOrder onChange (HTML):', newValue);
                setSortOrder(newValue);
              }}
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--grey-300)',
                fontSize: '14px',
                width: '80px'
              }}
            >
              <option value="desc">내림차순</option>
              <option value="asc">오름차순</option>
            </select>
          </FilterGroup>
        </FilterControls>
      </FilterSection>
      
      {/* 테이블 영역 */}
      <TableContainer>
        <Table.Root size="sm" variant="outline" backgroundColor="var(--white)">
          <Table.ColumnGroup>
            <Table.Column htmlWidth="25%" />
            <Table.Column htmlWidth="15%" />
            <Table.Column htmlWidth="15%" />
            <Table.Column htmlWidth="20%" />
            <Table.Column htmlWidth="10%" />
            <Table.Column htmlWidth="10%" />
            <Table.Column htmlWidth="5%" />
          </Table.ColumnGroup>
          <Table.Header>
            <Table.Row backgroundColor="var(--grey-50)">
              <Table.ColumnHeader>이메일</Table.ColumnHeader>
              <Table.ColumnHeader>이름</Table.ColumnHeader>
              <Table.ColumnHeader>전화번호</Table.ColumnHeader>
              <Table.ColumnHeader>소속 ID</Table.ColumnHeader>
              <Table.ColumnHeader>역할</Table.ColumnHeader>
              <Table.ColumnHeader>가입일</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">상세</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredUsers.map((user) => (
              <Table.Row 
                key={user.id}
                _hover={{ backgroundColor: "var(--grey-50)", cursor: "pointer" }}
                onClick={() => handleUserDetail(user)}
              >
                <Table.Cell>
                  <UserEmailCell>{user.email}</UserEmailCell>
                </Table.Cell>
                <Table.Cell>
                  <UserNameCell>
                    {user.first_name} {user.last_name}
                  </UserNameCell>
                </Table.Cell>
                <Table.Cell>
                  <PhoneCell>{user.phone || '-'}</PhoneCell>
                </Table.Cell>
                <Table.Cell>
                  <OrganizationCell>
                    {user.organization_id ? user.organization_id.slice(0, 8) + '...' : '-'}
                  </OrganizationCell>
                </Table.Cell>
                <Table.Cell>
                  <select
                    value={user.role || 'user'}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleRoleChange(user.id, e.target.value);
                    }}
                    disabled={isUpdatingRole === user.id}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--grey-300)',
                      fontSize: '14px',
                      backgroundColor: isUpdatingRole === user.id ? 'var(--grey-100)' : 'white',
                      cursor: isUpdatingRole === user.id ? 'not-allowed' : 'pointer'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="user">학생</option>
                    <option value="teacher">교사</option>
                    <option value="admin">관리자</option>
                  </select>
                </Table.Cell>
                <Table.Cell>
                  <DateCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                  </DateCell>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUserDetail(user);
                    }}
                  >
                    <FaEye />
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
            
            {filteredUsers.length === 0 && !isLoading && (
              <Table.Row>
                <Table.Cell colSpan={7} textAlign="center">
                  <EmptyState>
                    <FaUsers size={32} color="var(--grey-400)" />
                    <Text variant="body" color="var(--grey-500)">
                      {searchTerm || roleFilter ? '검색 조건에 맞는 회원이 없습니다' : '등록된 회원이 없습니다'}
                    </Text>
                  </EmptyState>
                </Table.Cell>
              </Table.Row>
            )}
            
            {isLoading && (
              <Table.Row>
                <Table.Cell colSpan={7} textAlign="center">
                  <LoadingState>로딩 중...</LoadingState>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </TableContainer>

      {/* Infinite scroll trigger element */}
      {!isReachingEnd && (
        <InfiniteScrollTrigger 
          ref={observerRef}
        >
          {isLoadingMore && (
            <LoadingIndicator>
              <Text variant="caption" color="var(--grey-600)">
                로딩 중...
              </Text>
            </LoadingIndicator>
          )}
        </InfiniteScrollTrigger>
      )}
      
      {isReachingEnd && users && users.length > 0 && (
        <EndMessage>
          <Text variant="caption" color="var(--grey-600)">
            모든 사용자를 불러왔습니다
          </Text>
        </EndMessage>
      )}

      {/* 모달들 */}
      <BulkUserCreationModal
        isOpen={isBulkCreateOpen}
        onClose={() => setIsBulkCreateOpen(false)}
        onSuccess={handleBulkCreateSuccess}
      />
      
      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={selectedUser}
      />
    </AdminContainer>
  );
}

// Styled Components
const AdminContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--grey-25);
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 8px;
`;

const StatCard = styled.div`
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--grey-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-600);
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: var(--grey-600);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const FilterSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--grey-200);
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SearchBar = styled.div`
  margin-bottom: 20px;
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--grey-50);
  border-radius: 8px;
  border: 1px solid var(--grey-200);
  
  &:focus-within {
    border-color: var(--primary-300);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterControls = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FilterLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--grey-600);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid var(--grey-200);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const UserEmailCell = styled.div`
  font-weight: 500;
  color: var(--primary-600);
`;

const UserNameCell = styled.div`
  font-weight: 500;
`;

const PhoneCell = styled.div`
  color: var(--grey-600);
  font-size: 14px;
`;

const OrganizationCell = styled.div`
  color: var(--grey-500);
  font-size: 12px;
  font-family: monospace;
`;

const DateCell = styled.div`
  color: var(--grey-600);
  font-size: 14px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
`;

const LoadingState = styled.div`
  padding: 40px 20px;
  color: var(--grey-600);
`;

const InfiniteScrollTrigger = styled.div`
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
`;

const LoadingIndicator = styled.div`
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  border: 1px solid var(--grey-200);
`;

const EndMessage = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid var(--grey-200);
`;

const DetailModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  
  @media (min-width: 768px) {
    min-width: 500px;
  }
`;

const UserInfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const UserInfoRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--grey-200);
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserInfoKey = styled.div`
  width: 120px;
  font-weight: 600;
  color: var(--grey-600);
  flex-shrink: 0;
`;

const UserInfoValue = styled.div`
  flex: 1;
  color: var(--grey-900);
`;