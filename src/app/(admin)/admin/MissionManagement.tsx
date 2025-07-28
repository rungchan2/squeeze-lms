"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { Loading } from "@/components/common/Loading";
import { useMission } from "@/hooks/useMission";
import { Error } from "@/components/common/Error";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { Table, Button, Stack, Input, Badge } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { FaPlus, FaTrash, FaSearch, FaFilter, FaTasks, FaEye, FaEdit } from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import { Modal } from "@/components/modal/Modal";
import RichTextViewer from "@/components/richTextInput/RichTextViewer";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { Spinner } from "@chakra-ui/react";

// 미션 타입 정의
type Mission = {
  id: string;
  name: string;
  description: string | null;
  mission_type: string | null;
  points: number | null;
};

// 미션 삭제 모달 컴포넌트
const DeleteMissionModal = memo(
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
            미션 삭제
          </Text>
          <Text variant="body">
            정말 이 미션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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

DeleteMissionModal.displayName = "DeleteMissionModal";

// 미션 상세 정보 모달 컴포넌트
const MissionDetailModal = memo(
  ({
    isOpen,
    onClose,
    mission,
    onEdit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    mission: Mission | null;
    onEdit: (id: string) => void;
  }) => {
    if (!mission) return null;

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <DetailModalContent>
          <Stack direction="row" justify="space-between" align="center">
            <Text variant="body" fontWeight="bold" style={{ fontSize: "20px" }}>
              {mission.name}
            </Text>
            <MissionInfoBadge>
              {mission.mission_type || "미분류"}
            </MissionInfoBadge>
          </Stack>

          <MissionInfoRow>
            <MissionInfoKey>포인트</MissionInfoKey>
            <MissionInfoValue>{mission.points || 0}점</MissionInfoValue>
          </MissionInfoRow>

          <Text variant="body" fontWeight="bold">
            미션 설명
          </Text>
          <DescriptionContainer>
            {mission.description ? (
              <RichTextViewer content={mission.description} />
            ) : (
              <EmptyDescription>미션 설명이 없습니다.</EmptyDescription>
            )}
          </DescriptionContainer>

          <Stack direction="row" justifyContent="flex-end" marginTop={4}>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              marginRight={2}
            >
              닫기
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => {
                onClose();
                onEdit(mission.id);
              }}
            >
              미션 편집
            </Button>
          </Stack>
        </DetailModalContent>
      </Modal>
    );
  }
);

MissionDetailModal.displayName = "MissionDetailModal";

// 미션 테이블 행 컴포넌트
const MissionTableRow = memo(
  ({
    mission,
    isMobile,
    onOpenDetail,
    onOpenDelete,
  }: {
    mission: Mission;
    isMobile: boolean;
    onOpenDetail: (mission: Mission) => void;
    onOpenDelete: (e: React.MouseEvent, id: string) => void;
  }) => {
    return (
      <Table.Row
        key={mission.id}
        onClick={() => onOpenDetail(mission)}
        _hover={{ backgroundColor: "var(--grey-100)", cursor: "pointer" }}
      >
        <Table.Cell>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mission.name}
          </div>
        </Table.Cell>
        {!isMobile && <Table.Cell>{mission.mission_type || "-"}</Table.Cell>}
        <Table.Cell textAlign={isMobile ? "center" : "end"}>
          {mission.points || 0}
        </Table.Cell>
        <Table.Cell textAlign="end">
          <Button
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={(e) => onOpenDelete(e, mission.id)}
          >
            <Stack direction="row" alignItems="center">
              <FaTrash />
            </Stack>
          </Button>
        </Table.Cell>
      </Table.Row>
    );
  }
);

MissionTableRow.displayName = "MissionTableRow";

// 미션 테이블 컴포넌트
const MissionTable = memo(
  ({
    missions,
    isMobile,
    onOpenDetail,
    onOpenDelete,
  }: {
    missions: Mission[];
    isMobile: boolean;
    onOpenDetail: (mission: Mission) => void;
    onOpenDelete: (e: React.MouseEvent, id: string) => void;
  }) => {

    return (
      <div>
        <Table.Root size="sm" variant="outline" backgroundColor="var(--white)">
          <Table.ColumnGroup>
            {!isMobile && (
              <>
                <Table.Column htmlWidth="40%" />
                <Table.Column htmlWidth="20%" />
                <Table.Column htmlWidth="15%" />
                <Table.Column htmlWidth="25%" />
              </>
            )}
          </Table.ColumnGroup>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>이름</Table.ColumnHeader>
              {!isMobile && <Table.ColumnHeader>카테고리</Table.ColumnHeader>}
              <Table.ColumnHeader textAlign={isMobile ? "center" : "end"}>
                {isMobile ? "점수" : "포인트"}
              </Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">관리</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {missions.length > 0 ? (
              missions.map((mission) => (
                <MissionTableRow
                  key={mission.id}
                  mission={mission as Mission}
                  isMobile={isMobile}
                  onOpenDetail={onOpenDetail}
                  onOpenDelete={onOpenDelete}
                />
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={isMobile ? 3 : 4} textAlign="center">
                  등록된 미션이 없습니다
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </div>
    );
  }
);

MissionTable.displayName = "MissionTable";

export default function MissionManagement() {
  console.log('[MissionManagement] Component rendering');
  const { missions, isLoading, error, deleteMission, mutate } = useMission();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  console.log('[MissionManagement] Current state:', {
    searchTerm, typeFilter, sortBy, sortOrder,
    missionsLength: missions?.length || 0,
    isLoading, error
  });

  // 필터링된 미션 목록
  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    
    let filtered = missions.filter(mission => {
      const matchesSearch = searchTerm === "" || 
        mission.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "" || mission.mission_type === typeFilter;
      
      return matchesSearch && matchesType;
    });

    // 정렬
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case "points":
          aValue = a.points || 0;
          bValue = b.points || 0;
          break;
        case "mission_type":
          aValue = a.mission_type || '';
          bValue = b.mission_type || '';
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
  }, [missions, searchTerm, typeFilter, sortBy, sortOrder]);

  // 미션 타입별 통계
  const missionStats = useMemo(() => {
    console.log('[MissionManagement] missionStats calculating, missions:', missions);
    if (!missions || missions.length === 0) {
      console.log('[MissionManagement] No missions, returning empty stats');
      return { total: 0, types: {} };
    }
    
    const types: Record<string, number> = {};
    missions.forEach((mission, index) => {
      const type = mission.mission_type || '미분류';
      console.log(`[MissionManagement] Mission ${index}: type="${type}"`);
      if (type && typeof type === 'string') {
        types[type] = (types[type] || 0) + 1;
      }
    });
    
    console.log('[MissionManagement] Final types:', types);
    return { total: missions.length, types };
  }, [missions]);

  // 권한 검증 로직을 useRoleCheck로 대체 - 다른 훅보다 먼저 호출
  const { loading: authLoading } = useRoleCheck({
    requiredRole: "admin",
    redirectTo: "/",
    showToast: true,
  });

  // 이벤트 핸들러 메모이제이션
  const handleAddMission = useCallback(() => {
    router.push("/mission/create");
  }, [router]);

  const handleEditMission = useCallback(
    (id: string) => {
      router.push(`/mission/edit/${id}`);
    },
    [router]
  );

  const openDeleteModal = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setSelectedMissionId(id);
    setIsDeleteModalOpen(true);
  }, []);

  const openDetailModal = useCallback((mission: Mission) => {
    setSelectedMission(mission);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);

  const handleDeleteMission = useCallback(async () => {
    if (!selectedMissionId) return;

    setIsDeleting(true);
    try {
      await deleteMission(selectedMissionId);
      toaster.create({
        title: "미션이 삭제되었습니다",
        type: "success",
      });
      mutate(); // 데이터 새로고침
    } catch (error) {
      console.error(error);
      toaster.create({
        title: "미션 삭제 중 오류가 발생했습니다",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSelectedMissionId(null);
    }
  }, [selectedMissionId, deleteMission, mutate]);

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // authLoading 중일 때 로딩 상태 표시
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <AdminContainer>
      {/* 헤더 영역 */}
      <HeaderSection>
        <HeaderInfo>
          <Stack direction="row" alignItems="center" gap={2}>
            <FaTasks size={20} color="var(--primary-600)" />
            <Text variant="body" fontWeight="bold" style={{ fontSize: "18px" }}>미션 관리</Text>
          </Stack>
          <StatsGrid>
            <StatCard>
              <StatValue>{missionStats.total}</StatValue>
              <StatLabel>전체 미션</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{filteredMissions.length}</StatValue>
              <StatLabel>검색 결과</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{Object.keys(missionStats.types).length}</StatValue>
              <StatLabel>미션 타입</StatLabel>
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
          <Button size="sm" colorScheme="blue" onClick={handleAddMission}>
            <FaPlus />
            새 미션 추가
          </Button>
        </ActionButtons>
      </HeaderSection>

      {/* 검색 및 필터 영역 */}
      <FilterSection>
        <SearchBar>
          <SearchInput>
            <FaSearch color="var(--grey-400)" />
            <Input
              placeholder="미션 이름, 설명으로 검색..."
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
              타입
            </FilterLabel>
            <select 
              value={typeFilter}
              onChange={(e) => {
                const newValue = e.target.value || "";
                console.log('[MissionManagement] TypeFilter onChange (HTML):', newValue);
                setTypeFilter(newValue);
              }}
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--grey-300)',
                fontSize: '14px',
                width: '150px'
              }}
            >
              <option value="">전체</option>
              {Object.keys(missionStats.types || {})
                .filter(type => type && typeof type === 'string' && type.trim() !== '')
                .map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
            </select>
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>정렬</FilterLabel>
            <select 
              value={sortBy}
              onChange={(e) => {
                const newValue = e.target.value || "created_at";
                console.log('[MissionManagement] SortBy onChange (HTML):', newValue);
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
              <option value="points">포인트</option>
              <option value="mission_type">타입</option>
            </select>
          </FilterGroup>

          <FilterGroup>
            <select 
              value={sortOrder}
              onChange={(e) => {
                const newValue = (e.target.value || "desc") as "asc" | "desc";
                console.log('[MissionManagement] SortOrder onChange (HTML):', newValue);
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
            <Table.Column htmlWidth="30%" />
            <Table.Column htmlWidth="15%" />
            <Table.Column htmlWidth="15%" />
            <Table.Column htmlWidth="25%" />
            <Table.Column htmlWidth="15%" />
          </Table.ColumnGroup>
          <Table.Header>
            <Table.Row backgroundColor="var(--grey-50)">
              <Table.ColumnHeader>미션 이름</Table.ColumnHeader>
              <Table.ColumnHeader>타입</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">포인트</Table.ColumnHeader>
              <Table.ColumnHeader>설명</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="center">관리</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredMissions.map((mission) => (
              <Table.Row 
                key={mission.id}
                _hover={{ backgroundColor: "var(--grey-50)", cursor: "pointer" }}
                onClick={() => openDetailModal(mission)}
              >
                <Table.Cell>
                  <MissionNameCell>
                    <div style={{ fontWeight: 500 }}>{mission.name}</div>
                  </MissionNameCell>
                </Table.Cell>
                <Table.Cell>
                  <Badge 
                    colorScheme={mission.mission_type ? "blue" : "gray"} 
                    variant="subtle" 
                    size="sm"
                  >
                    {mission.mission_type || "미분류"}
                  </Badge>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <PointsCell>{mission.points || 0}점</PointsCell>
                </Table.Cell>
                <Table.Cell>
                  <DescriptionCell>
                    {mission.description ? 
                      mission.description.replace(/<[^>]*>/g, '').slice(0, 50) + 
                      (mission.description.length > 50 ? '...' : '')
                      : '설명 없음'
                    }
                  </DescriptionCell>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <ActionButtonGroup>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(mission);
                      }}
                    >
                      <FaEye />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="green"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMission(mission.id);
                      }}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => openDeleteModal(e, mission.id)}
                    >
                      <FaTrash />
                    </Button>
                  </ActionButtonGroup>
                </Table.Cell>
              </Table.Row>
            ))}
            
            {filteredMissions.length === 0 && !isLoading && (
              <Table.Row>
                <Table.Cell colSpan={5} textAlign="center">
                  <EmptyState>
                    <FaTasks size={32} color="var(--grey-400)" />
                    <Text variant="body" color="var(--grey-500)">
                      {searchTerm || typeFilter ? '검색 조건에 맞는 미션이 없습니다' : '등록된 미션이 없습니다'}
                    </Text>
                  </EmptyState>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </TableContainer>

      {/* 모달들 */}
      <DeleteMissionModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={handleDeleteMission}
        isDeleting={isDeleting}
      />

      <MissionDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        mission={selectedMission}
        onEdit={handleEditMission}
      />
    </AdminContainer>
  );
}

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
  grid-template-columns: repeat(3, 1fr);
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

const MissionNameCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PointsCell = styled.div`
  font-weight: 600;
  color: var(--primary-600);
`;

const DescriptionCell = styled.div`
  color: var(--grey-600);
  font-size: 14px;
  line-height: 1.4;
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

// 기존 스타일들 (모달용)
const DetailModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;

  @media (min-width: 768px) {
    min-width: 600px;
  }
`;

const MissionInfoBadge = styled.span`
  background-color: var(--primary-50);
  color: var(--primary-700);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
`;

const MissionInfoRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--grey-200);
`;

const MissionInfoKey = styled.div`
  width: 100px;
  font-weight: 600;
  color: var(--grey-600);
`;

const MissionInfoValue = styled.div`
  flex: 1;
`;

const DescriptionContainer = styled.div`
  padding: 12px;
  border-radius: 8px;
  background-color: var(--grey-50);
  min-height: 120px;
  max-height: 400px;
  overflow-y: auto;
`;

const EmptyDescription = styled.div`
  color: var(--grey-500);
  font-style: italic;
  padding: 12px 0;
`;
