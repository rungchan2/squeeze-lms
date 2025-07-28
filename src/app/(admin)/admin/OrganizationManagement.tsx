"use client";

import { useState, useCallback, memo, useMemo, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { Table, Button, Stack, Input } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { FaPlus, FaTrash, FaSearch, FaBuilding, FaEye } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import Text from "@/components/Text/Text";
import { Modal } from "@/components/modal/Modal";
import styled from "@emotion/styled";

// 조직 타입 정의
type Organization = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// 조직 삭제 모달 컴포넌트
const DeleteOrganizationModal = memo(
  ({
    isOpen,
    onClose,
    onDelete,
    isDeleting,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onDelete: () => void;
    isDeleting: boolean;
  }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <Stack direction="column" gap={4}>
          <Text variant="body" fontWeight="bold">
            소속 삭제
          </Text>
          <Text variant="body">
            정말 이 소속을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Text>
          <Stack direction="row" justifyContent="flex-end" marginTop={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              marginRight={2}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    );
  }
);

DeleteOrganizationModal.displayName = "DeleteOrganizationModal";

// 조직 상세 정보 모달 컴포넌트
const OrganizationDetailModal = memo(
  ({
    isOpen,
    onClose,
    organization,
  }: {
    isOpen: boolean;
    onClose: () => void;
    organization: Organization | null;
  }) => {
    if (!organization) return null;

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <DetailModalContent>
          <Stack direction="row" justify="space-between" align="center">
            <Text variant="body" fontWeight="bold" style={{ fontSize: "20px" }}>
              {organization.name}
            </Text>
          </Stack>

          <OrganizationInfoRow>
            <OrganizationInfoKey>ID</OrganizationInfoKey>
            <OrganizationInfoValue>{organization.id}</OrganizationInfoValue>
          </OrganizationInfoRow>

          <OrganizationInfoRow>
            <OrganizationInfoKey>생성일</OrganizationInfoKey>
            <OrganizationInfoValue>
              {organization.created_at ? new Date(organization.created_at).toLocaleString('ko-KR') : '정보 없음'}
            </OrganizationInfoValue>
          </OrganizationInfoRow>

          <OrganizationInfoRow>
            <OrganizationInfoKey>설명</OrganizationInfoKey>
            <OrganizationInfoValue>
              {organization.description || '설명 없음'}
            </OrganizationInfoValue>
          </OrganizationInfoRow>

          <Stack direction="row" justifyContent="flex-end" marginTop={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              닫기
            </Button>
          </Stack>
        </DetailModalContent>
      </Modal>
    );
  }
);

OrganizationDetailModal.displayName = "OrganizationDetailModal";

const OrganizationManagement = memo(function OrganizationManagement() {
  console.log('[OrganizationManagement] Component rendering');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const { 
    data: { useOrganizationList },
    actions: { createOrganization, deleteOrganization }
  } = useOrganization();
  
  const { organizations, mutate } = useOrganizationList();
  
  console.log('[OrganizationManagement] Hook data:', {
    organizations: organizations?.length || 0,
    hasUseOrganizationList: !!useOrganizationList,
    hasActions: typeof createOrganization === 'function' && typeof deleteOrganization === 'function'
  });

  // 무한 렌더링 감지
  useEffect(() => {
    console.log('[OrganizationManagement] Component mounted/updated');
    return () => {
      console.log('[OrganizationManagement] Component cleanup');
    };
  });

  // 필터링된 조직 목록
  const filteredOrganizations = useMemo(() => {
    if (!organizations) return [];
    
    let filtered = organizations.filter(org => {
      const matchesSearch = searchTerm === "" || 
        org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name || '';
          bValue = b.name || '';
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
  }, [organizations, searchTerm, sortBy, sortOrder]);

  // 조직 통계
  const organizationStats = useMemo(() => {
    if (!organizations) return { total: 0 };
    return { total: organizations.length };
  }, [organizations]);

  // 이벤트 핸들러 메모이제이션
  const handleCreateOrganization = useCallback(async () => {
    if (!organizationName.trim()) {
      toaster.create({
        title: "소속 이름을 입력해주세요",
        type: "warning",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await createOrganization({ 
        name: organizationName, 
        description: "",
        created_at: null, 
        updated_at: null 
      });
      toaster.create({
        title: "소속이 생성되었습니다",
        type: "success",
      });
      setOrganizationName("");
      setIsCreateModalOpen(false);
      mutate();
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "소속 생성 중 오류가 발생했습니다",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationName, createOrganization, mutate]);

  const openDeleteModal = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedOrganizationId(id);
    setIsDeleteModalOpen(true);
  }, []);

  const openDetailModal = useCallback((organization: Organization) => {
    setSelectedOrganization(organization);
    setIsDetailModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setOrganizationName("");
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedOrganizationId(null);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedOrganization(null);
  }, []);

  const handleDeleteOrganization = useCallback(async () => {
    if (!selectedOrganizationId) return;

    setIsDeleting(true);
    try {
      await deleteOrganization(selectedOrganizationId);
      toaster.create({
        title: "소속이 삭제되었습니다",
        type: "success",
      });
      mutate();
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "소속 삭제 중 오류가 발생했습니다",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSelectedOrganizationId(null);
    }
  }, [selectedOrganizationId, deleteOrganization, mutate]);

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return (
    <AdminContainer>
      {/* 헤더 영역 */}
      <HeaderSection>
        <HeaderInfo>
          <Stack direction="row" alignItems="center" gap={2}>
            <FaBuilding size={20} color="var(--primary-600)" />
            <Text variant="body" fontWeight="bold" style={{ fontSize: "18px" }}>소속 관리</Text>
          </Stack>
          <StatsGrid>
            <StatCard>
              <StatValue>{organizationStats.total}</StatValue>
              <StatLabel>전체 소속</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{filteredOrganizations.length}</StatValue>
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
          <Button size="sm" colorScheme="blue" onClick={() => setIsCreateModalOpen(true)}>
            <FaPlus />
            새 소속 추가
          </Button>
        </ActionButtons>
      </HeaderSection>

      {/* 검색 및 필터 영역 */}
      <FilterSection>
        <SearchBar>
          <SearchInput>
            <FaSearch color="var(--grey-400)" />
            <Input
              placeholder="소속 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="subtle"
              style={{ border: 'none', boxShadow: 'none' }}
            />
          </SearchInput>
        </SearchBar>
        
        <FilterControls>
          <FilterGroup>
            <FilterLabel>정렬</FilterLabel>
            <select 
              value={sortBy}
              onChange={(e) => {
                const newValue = e.target.value || "created_at";
                console.log('[OrganizationManagement] SortBy onChange (HTML):', newValue);
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
              <option value="created_at">생성일</option>
              <option value="name">이름</option>
            </select>
          </FilterGroup>

          <FilterGroup>
            <select 
              value={sortOrder}
              onChange={(e) => {
                const newValue = (e.target.value || "desc") as "asc" | "desc";
                console.log('[OrganizationManagement] SortOrder onChange (HTML):', newValue);
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
            <Table.Column htmlWidth="40%" />
            <Table.Column htmlWidth="30%" />
            <Table.Column htmlWidth="15%" />
            <Table.Column htmlWidth="15%" />
          </Table.ColumnGroup>
          <Table.Header>
            <Table.Row backgroundColor="var(--grey-50)">
              <Table.ColumnHeader>소속명</Table.ColumnHeader>
              <Table.ColumnHeader>ID</Table.ColumnHeader>
              <Table.ColumnHeader>생성일</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">관리</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredOrganizations.map((organization) => (
              <Table.Row 
                key={organization.id}
                _hover={{ backgroundColor: "var(--grey-50)", cursor: "pointer" }}
                onClick={() => openDetailModal(organization)}
              >
                <Table.Cell>
                  <OrganizationNameCell>
                    <div style={{ fontWeight: 500 }}>{organization.name}</div>
                  </OrganizationNameCell>
                </Table.Cell>
                <Table.Cell>
                  <IdCell>
                    {organization.id.slice(0, 8)}...
                  </IdCell>
                </Table.Cell>
                <Table.Cell>
                  <DateCell>
                    {organization.created_at ? new Date(organization.created_at).toLocaleDateString('ko-KR') : '-'}
                  </DateCell>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <ActionButtonGroup>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(organization);
                      }}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => openDeleteModal(e, organization.id)}
                    >
                      <FaTrash />
                    </Button>
                  </ActionButtonGroup>
                </Table.Cell>
              </Table.Row>
            ))}
            
            {filteredOrganizations.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={4} textAlign="center">
                  <EmptyState>
                    <FaBuilding size={32} color="var(--grey-400)" />
                    <Text variant="body" color="var(--grey-500)">
                      {searchTerm ? '검색 조건에 맞는 소속이 없습니다' : '등록된 소속이 없습니다'}
                    </Text>
                  </EmptyState>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </TableContainer>

      {/* 모달들 */}
      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal}>
        <Stack direction="column" gap={4}>
          <Text variant="body" fontWeight="bold">새 소속 추가</Text>
          <Input
            placeholder="소속 이름 입력"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
          />
          <Stack direction="row" justifyContent="flex-end" marginTop={2}>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={closeCreateModal}
              marginRight={2}
            >
              취소
            </Button>
            <Button 
              size="sm"
              colorScheme="blue" 
              onClick={handleCreateOrganization}
              disabled={isLoading}
            >
              {isLoading ? "처리 중..." : "추가"}
            </Button>
          </Stack>
        </Stack>
      </Modal>

      <DeleteOrganizationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={handleDeleteOrganization}
        isDeleting={isDeleting}
      />

      <OrganizationDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        organization={selectedOrganization}
      />
    </AdminContainer>
  );
});

OrganizationManagement.displayName = "OrganizationManagement";

export default OrganizationManagement;

// Styled Components (새로운 디자인)
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

const OrganizationNameCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const IdCell = styled.div`
  color: var(--grey-500);
  font-size: 12px;
  font-family: monospace;
`;

const DateCell = styled.div`
  color: var(--grey-600);
  font-size: 14px;
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 4px;
  justify-content: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
`;

// 모달용 스타일들
const DetailModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  @media (min-width: 768px) {
    min-width: 500px;
  }
`;

const OrganizationInfoRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--grey-200);
`;

const OrganizationInfoKey = styled.div`
  width: 100px;
  font-weight: 600;
  color: var(--grey-600);
`;

const OrganizationInfoValue = styled.div`
  flex: 1;
`;
