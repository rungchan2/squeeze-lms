'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Text,
  Box,
  HStack,
  VStack,
  CloseButton,
} from '@chakra-ui/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toaster } from '@/components/ui/toaster';
import { useStatisticsReportsCRUD } from '@/hooks/useStatisticsReports';
import { WordGroupsConfig } from '@/types/statistics-report';

const saveReportSchema = z.object({
  name: z.string().min(1, '보고서 이름을 입력해주세요'),
  description: z.string().optional(),
});

type SaveReportFormData = z.infer<typeof saveReportSchema>;

interface SaveReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string;
  wordGroups: WordGroupsConfig;
  currentSettings?: {
    minFrequency?: number;
    showQuestionText?: boolean;
  };
}

export function SaveReportModal({
  open,
  onOpenChange,
  journeyId,
  wordGroups,
  currentSettings,
}: SaveReportModalProps) {
  const [includeSettings, setIncludeSettings] = useState(true);
  const { createReport } = useStatisticsReportsCRUD(journeyId);

  const form = useForm<SaveReportFormData>({
    resolver: zodResolver(saveReportSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: SaveReportFormData) => {
    try {
      // Prepare word groups config with settings if needed
      const configToSave: WordGroupsConfig = {
        ...wordGroups,
        settings: includeSettings && currentSettings
          ? {
              ...wordGroups.settings,
              minFrequency: currentSettings.minFrequency ?? wordGroups.settings.minFrequency,
              showQuestionText: currentSettings.showQuestionText ?? wordGroups.settings.showQuestionText,
            }
          : wordGroups.settings,
      };

      await createReport({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        word_groups: configToSave,
        metadata: {
          createdAt: new Date().toISOString(),
          includesSettings: includeSettings,
        },
      });

      toaster.create({
        title: '보고서 저장 완료',
        description: `"${data.name}" 보고서가 성공적으로 저장되었습니다.`,
        type: 'success',
      });

      // Reset form and close
      form.reset();
      setIncludeSettings(true);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving report:', error);
      toaster.create({
        title: '저장 실패',
        description: '보고서 저장 중 오류가 발생했습니다. 다시 시도해주세요.',
        type: 'error',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    setIncludeSettings(true);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
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
        borderRadius="md"
        boxShadow="xl"
        maxW="500px"
        w="90%"
        maxH="90vh"
        overflowY="auto"
      >
        <Box p={6} borderBottomWidth="1px">
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold">
              💾 통계 보고서 저장
            </Text>
            <CloseButton onClick={handleClose} />
          </HStack>
        </Box>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Box p={6}>
              <VStack gap={4} align="stretch">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>보고서 이름 *</FormLabel>
                      <FormControl>
                        <Input placeholder="예: 2024년 1학기 중간 분석" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명 (선택사항)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="중간고사 이후 학생들의 주요 관심사 분석..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <VStack align="stretch" gap={2}>
                  <HStack gap={2}>
                    <Checkbox
                      checked={includeSettings}
                      onCheckedChange={(checked) => setIncludeSettings(!!checked)}
                    />
                    <Text fontSize="sm">현재 필터 설정 포함</Text>
                  </HStack>
                  {includeSettings && currentSettings && (
                    <Text fontSize="xs" color="gray.600" pl={6}>
                      최소 단어 횟수: {currentSettings.minFrequency ?? 2}회
                      {currentSettings.showQuestionText !== undefined && (
                        <>, 질문 텍스트 표시: {currentSettings.showQuestionText ? '예' : '아니오'}</>
                      )}
                    </Text>
                  )}
                </VStack>

                <Text fontSize="sm" color="gray.600">
                  단어 그룹 {wordGroups.groups.length}개가 저장됩니다.
                  저장 후에도 최신 데이터로 통계가 업데이트됩니다.
                </Text>
              </VStack>
            </Box>

            <Box p={6} borderTopWidth="1px">
              <HStack gap={3} justify="flex-end">
                <Button variant="ghost" onClick={handleClose}>
                  취소
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  loading={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? '저장 중...' : '저장'}
                </Button>
              </HStack>
            </Box>
          </form>
        </Form>
      </Box>
    </Box>
  );
}