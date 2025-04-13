"use client";

import { useState, useCallback, memo } from "react";
import { Loading } from "@/components/common/Loading";
import { useMission } from "@/hooks/useMission";
import { Error } from "@/components/common/Error";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { Table, Button, Stack } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Modal } from "@/components/modal/Modal";
import RichTextViewer from "@/components/richTextInput/RichTextViewer";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// 미션 타입 정의
type Mission = {
  id: string;
  name: string;
  description: string | null;
  mission_type: string | null;
  points: number | null;
};

// 미션 삭제 모달 컴포넌트
const DeleteMissionModal = memo(({
  isOpen,
  onClose,
  onDelete,
  isDeleting
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Stack direction="column" gap={4}>
        <Text variant="body" fontWeight="bold">미션 삭제</Text>
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
});

DeleteMissionModal.displayName = "DeleteMissionModal";

// 미션 상세 정보 모달 컴포넌트
const MissionDetailModal = memo(({
  isOpen,
  onClose,
  mission,
  onEdit
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
          <Text variant="body" fontWeight="bold" style={{ fontSize: '20px' }}>
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
        
        <Text variant="body" fontWeight="bold">미션 설명</Text>
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
});

MissionDetailModal.displayName = "MissionDetailModal";

// 미션 테이블 행 컴포넌트
const MissionTableRow = memo(({
  mission, 
  isMobile,
  onOpenDetail,
  onOpenDelete
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
        <Ellipsis>{mission.name}</Ellipsis>
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
});

MissionTableRow.displayName = "MissionTableRow";

// 미션 테이블 컴포넌트
const MissionTable = memo(({
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
  console.log('MissionTable rendering');
  
  return (
    <ResponsiveTable isMobile={isMobile}>
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
    </ResponsiveTable>
  );
});

MissionTable.displayName = "MissionTable";

export default function MissionManagement() {
  const { missions, isLoading, error, deleteMission, mutate } = useMission();
  const { role } = useSupabaseAuth();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 반응형 디자인을 위한 미디어 쿼리
  const isMobile = useMediaQuery("(max-width: 480px)");
  
  useEffect(() => {
    if (role !== "admin") {
      toaster.create({
        title: "관리자 권한이 필요합니다.",
        type: "error",
      });
      router.push("/");
    }
  }, [role, router]);

  // 이벤트 핸들러 메모이제이션 - 훅을 조건문보다 먼저 호출
  const handleAddMission = useCallback(() => {
    router.push("/mission/create");
  }, [router]);
  
  const handleEditMission = useCallback((id: string) => {
    router.push(`/mission/edit/${id}`);
  }, [router]);
  
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

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <Container>
      <Stack direction="row" justify="space-between" marginBottom={4}>
        <Text variant="body" fontWeight="bold">미션 관리</Text>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleAddMission}
        >
          <Stack direction="row" alignItems="center">
            <FaPlus />
            <span>새 미션 추가</span>
          </Stack>
        </Button>
      </Stack>
      
      {/* 미션 테이블 (메모이제이션된 컴포넌트) */}
      <MissionTable 
        missions={missions}
        isMobile={isMobile}
        onOpenDetail={openDetailModal}
        onOpenDelete={openDeleteModal}
      />
      
      {/* 삭제 확인 모달 (메모이제이션된 컴포넌트) */}
      <DeleteMissionModal 
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={handleDeleteMission}
        isDeleting={isDeleting}
      />
      
      {/* 미션 상세 정보 모달 (메모이제이션된 컴포넌트) */}
      <MissionDetailModal 
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        mission={selectedMission}
        onEdit={handleEditMission}
      />
    </Container>
  );
}

const Container = styled.div`
  padding: 16px;
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
`;

const ResponsiveTable = styled.div<{ isMobile: boolean }>`
  width: 100%;
  overflow-x: auto;
  
  ${({ isMobile }) => isMobile && `
    font-size: 0.875rem;
  `}
`;

const Ellipsis = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const DetailModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  
  /* 데스크톱에서 모달 너비 */
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
