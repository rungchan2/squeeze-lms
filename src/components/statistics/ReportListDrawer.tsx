'use client';

import { useState } from 'react';
import {
  Drawer,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  IconButton,
  Spinner,
  Portal,
  CloseButton,
  Separator,
} from '@chakra-ui/react';
import { FiTrash2, FiEdit, FiCheck, FiPlus, FiClock } from 'react-icons/fi';
import { toaster } from '@/components/ui/toaster';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStatisticsReportsCRUD } from '@/hooks/useStatisticsReports';
import { StatisticsReport, WordGroupsConfig } from '@/types/statistics-report';
import { applyReportToLatestData } from '@/utils/api/statistics-analysis';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useRef } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface ReportListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string;
  onApplyReport: (report: StatisticsReport, data: any) => void;
  onCreateNew: () => void;
  currentUserId?: string;
}

export function ReportListDrawer({
  open,
  onOpenChange,
  journeyId,
  onApplyReport,
  onCreateNew,
  currentUserId,
}: ReportListDrawerProps) {
  const { session } = useSupabaseAuth();
  const { reports, isLoading, error, deleteReport } = useStatisticsReportsCRUD(journeyId);
  const [applyingReportId, setApplyingReportId] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleApplyReport = async (report: StatisticsReport) => {
    setApplyingReportId(report.id);
    
    const token = session?.access_token;
    if (!token) {
      toaster.create({
        title: '인증 오류',
        description: '로그인이 필요합니다.',
        type: 'error',
      });
      return;
    }
    
    try {
      const data = await applyReportToLatestData({
        journeyId,
        wordGroups: report.word_groups.groups,
        minFrequency: report.word_groups.settings?.minFrequency,
        topN: 100,
      }, token);

      onApplyReport(report, data);
      
      toaster.create({
        title: '보고서 적용 완료',
        description: `"${report.name}" 보고서가 최신 데이터로 적용되었습니다.`,
        type: 'success',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying report:', error);
      toaster.create({
        title: '적용 실패',
        description: '보고서 적용 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setApplyingReportId(null);
    }
  };

  const handleDeleteReport = async () => {
    if (!deletingReportId) return;
    
    const report = reports.find(r => r.id === deletingReportId);
    if (!report) return;

    try {
      await deleteReport(deletingReportId);
      
      toaster.create({
        title: '삭제 완료',
        description: `"${report.name}" 보고서가 삭제되었습니다.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toaster.create({
        title: '삭제 실패',
        description: '보고서 삭제 중 오류가 발생했습니다.',
        type: 'error',
      });
    } finally {
      setDeletingReportId(null);
      setDeleteDialogOpen(false);
    }
  };

  const openDeleteAlert = (reportId: string) => {
    setDeletingReportId(reportId);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Drawer.Root 
        open={open} 
        onOpenChange={(details) => onOpenChange(details.open)}
        placement="end"
        size="md"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header>
                📊 저장된 통계 보고서
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </Drawer.Header>

              <Drawer.Body>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" />
                <Text mt={4}>보고서 불러오는 중...</Text>
              </Box>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>
                  보고서를 불러오는 중 오류가 발생했습니다.
                </AlertDescription>
              </Alert>
            ) : reports.length === 0 ? (
              <VStack gap={4} py={8}>
                <Text color="gray.500">저장된 보고서가 없습니다.</Text>
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    onOpenChange(false);
                    onCreateNew();
                  }}
                >
                  <FiPlus />
                  첫 보고서 만들기
                </Button>
              </VStack>
            ) : (
              <VStack gap={3} align="stretch">
                {reports.map((report) => (
                  <Box
                    key={report.id}
                    p={4}
                    borderWidth={1}
                    borderRadius="lg"
                    borderColor="gray.200"
                    bg="white"
                    _hover={{ bg: "gray.50" }}
                    transition="background 0.2s"
                  >
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="md">
                          📝 {report.name}
                        </Text>
                        {report.created_at && (
                          <Text fontSize="xs" color="gray.500">
                            <FiClock style={{ display: 'inline', marginRight: 4 }} />
                            {dayjs(report.created_at).fromNow()}
                          </Text>
                        )}
                      </HStack>

                      {report.description && (
                        <Text 
                          fontSize="sm" 
                          color="gray.600" 
                          css={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {report.description}
                        </Text>
                      )}

                      <HStack gap={2} flexWrap="wrap">
                        {report.word_groups.groups.slice(0, 3).map((group) => (
                          <Badge
                            key={group.id}
                            px={2}
                            py={1}
                            borderRadius="full"
                            style={{ backgroundColor: group.color + '20', color: group.color }}
                          >
                            {group.name}
                          </Badge>
                        ))}
                        {report.word_groups.groups.length > 3 && (
                          <Badge variant="outline" colorScheme="gray">
                            +{report.word_groups.groups.length - 3}
                          </Badge>
                        )}
                      </HStack>

                      <Separator />

                      <HStack gap={2} justify="flex-end">
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleApplyReport(report)}
                          loading={applyingReportId === report.id}
                        >
                          <FiCheck />
                          {applyingReportId === report.id ? '적용 중...' : '적용'}
                        </Button>
                        {currentUserId === report.created_by && (
                          <IconButton
                            size="sm"
                            aria-label="삭제"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => openDeleteAlert(report.id)}
                          >
                            <FiTrash2 />
                          </IconButton>
                        )}
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
              </Drawer.Body>

              <Drawer.Footer>
                <Button
                  colorScheme="blue"
                  w="full"
                  onClick={() => {
                    onOpenChange(false);
                    onCreateNew();
                  }}
                >
                  <FiPlus />
                  새 보고서 만들기
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      {/* Simple confirmation dialog */}
      {deleteDialogOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <Box
            bg="white"
            p={6}
            borderRadius="md"
            boxShadow="xl"
            maxW="400px"
            w="90%"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              보고서 삭제
            </Text>
            <Text mb={6}>
              이 보고서를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </Text>
            <HStack gap={3} justify="flex-end">
              <Button onClick={() => setDeleteDialogOpen(false)}>
                취소
              </Button>
              <Button colorScheme="red" onClick={handleDeleteReport}>
                삭제
              </Button>
            </HStack>
          </Box>
        </Box>
      )}
    </>
  );
}