import { useState, useCallback } from "react";
import { Modal } from "@/components/modal/Modal";
import { Stack, Button, Text as ChakraText } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import CSVUpload from "./CSVUpload";
import FieldMappingTable from "./FieldMappingTable";
import { toaster } from "@/components/ui/toaster";

interface BulkUserCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CSVData {
  headers: string[];
  rows: string[][];
}

interface FieldMapping {
  [key: string]: string; // CSV column -> user field
}

interface CreationResult {
  success: boolean;
  total: number;
  created: number;
  failed: number;
  skipped: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  skippedUsers: Array<{
    row: number;
    email: string;
    reason: string;
  }>;
}

enum Step {
  UPLOAD = 'upload',
  MAPPING = 'mapping',
  PREVIEW = 'preview',
  CREATING = 'creating',
  RESULT = 'result'
}

export default function BulkUserCreationModal({
  isOpen,
  onClose,
  onSuccess
}: BulkUserCreationModalProps) {
  const [step, setStep] = useState<Step>(Step.UPLOAD);
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [creationResult, setCreationResult] = useState<CreationResult | null>(null);

  const resetModal = () => {
    setStep(Step.UPLOAD);
    setCsvData(null);
    setFieldMapping({});
    setIsCreating(false);
    setCreationProgress(0);
    setCurrentEmail('');
    setCreationResult(null);
  };

  const handleClose = () => {
    if (!isCreating) {
      resetModal();
      onClose();
    }
  };

  const handleCSVUpload = useCallback((data: CSVData) => {
    setCsvData(data);
    // Auto-map common fields
    const autoMapping: FieldMapping = {};
    data.headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader.includes('email') || lowerHeader.includes('이메일')) {
        autoMapping[header] = 'email';
      } else if (lowerHeader.includes('password') || lowerHeader.includes('비밀번호')) {
        autoMapping[header] = 'password';
      } else if (lowerHeader.includes('first') || lowerHeader.includes('이름') || lowerHeader.includes('성명')) {
        autoMapping[header] = 'first_name';
      } else if (lowerHeader.includes('last') || lowerHeader.includes('성')) {
        autoMapping[header] = 'last_name';
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('전화') || lowerHeader.includes('핸드폰')) {
        autoMapping[header] = 'phone';
      } else if (lowerHeader.includes('org') || lowerHeader.includes('소속') || lowerHeader.includes('조직')) {
        autoMapping[header] = 'organization_name';
      }
      // Note: role mapping removed - all users will be created as 'user' role
    });
    setFieldMapping(autoMapping);
    setStep(Step.MAPPING);
  }, []);

  const handleMappingComplete = () => {
    // Validate required fields are mapped
    const requiredFields = ['email', 'password', 'first_name', 'last_name'];
    const mappedFields = Object.values(fieldMapping);
    
    const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
    
    if (missingFields.length > 0) {
      toaster.create({
        title: "필수 필드 매핑 누락",
        description: `다음 필드를 매핑해주세요: ${missingFields.join(', ')}`,
        type: "error",
      });
      return;
    }

    setStep(Step.PREVIEW);
  };

  const handleCreateUsers = async () => {
    if (!csvData) return;

    setIsCreating(true);
    setStep(Step.CREATING);
    setCreationProgress(0);
    setCurrentEmail('');

    try {
      // Transform CSV data to user objects
      const users = csvData.rows.map(row => {
        const user: any = {};
        csvData.headers.forEach((header, index) => {
          const mappedField = fieldMapping[header];
          if (mappedField && row[index]) {
            user[mappedField] = row[index].trim();
          }
        });
        return user;
      });

      console.log('[BULK_CREATE_UI] Starting streaming request with users:', users.length);
      
      // Use streaming API for real-time progress
      const response = await fetch('/api/users/bulk-create-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.type === 'progress') {
                  const progress = Math.round((data.current / data.total) * 100);
                  setCreationProgress(progress);
                  setCurrentEmail(data.email || '');
                } else if (data.type === 'result') {
                  setCreationResult(data.result);
                  setCreationProgress(100);
                  setStep(Step.RESULT);
                  
                  // Show toast notifications
                  if (data.result.success) {
                    const skippedText = data.result.skipped > 0 ? `, ${data.result.skipped}명 중복` : '';
                    toaster.create({
                      title: "사용자 생성 완료",
                      description: `${data.result.created}명 생성${skippedText}`,
                      type: "success",
                    });
                    onSuccess();
                  } else {
                    // Check if timeout occurred
                    const hasTimeoutError = data.result.errors.some((error: any) => error.email === 'TIMEOUT');
                    if (hasTimeoutError) {
                      toaster.create({
                        title: "타임아웃으로 중단됨",
                        description: `${data.result.created}명 생성 완료, 나머지는 시간 제한으로 중단됨`,
                        type: "warning",
                      });
                    } else {
                      toaster.create({
                        title: "일부 사용자 생성 실패",
                        description: `${data.result.created}명 성공, ${data.result.failed}명 실패, ${data.result.skipped}명 중복`,
                        type: "warning",
                      });
                    }
                  }
                }
              } catch (parseError) {
                console.error('[BULK_CREATE_UI] Parse error:', parseError, 'Line:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Bulk user creation error:', error);
      toaster.create({
        title: "사용자 생성 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        type: "error",
      });
      setStep(Step.MAPPING);
    } finally {
      setIsCreating(false);
    }
  };

  const getPreviewData = () => {
    if (!csvData) return [];
    
    return csvData.rows.slice(0, 5).map(row => {
      const user: any = {};
      csvData.headers.forEach((header, index) => {
        const mappedField = fieldMapping[header];
        if (mappedField && row[index]) {
          user[mappedField] = row[index].trim();
        }
      });
      return user;
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case Step.UPLOAD:
        return <CSVUpload onUpload={handleCSVUpload} />;
      
      case Step.MAPPING:
        return csvData ? (
          <FieldMappingTable
            headers={csvData.headers}
            mapping={fieldMapping}
            onMappingChange={setFieldMapping}
          />
        ) : null;
      
      case Step.PREVIEW:
        const previewData = getPreviewData();
        return (
          <Stack gap={4}>
            <Text variant="body" fontWeight="bold">데이터 미리보기 (최대 5개)</Text>
            <Stack gap={2}>
              {previewData.map((user, index) => (
                <Stack key={index} direction="row" gap={4} padding={2} backgroundColor="var(--grey-50)" borderRadius="md">
                  <ChakraText fontSize="sm">이메일: {user.email}</ChakraText>
                  <ChakraText fontSize="sm">이름: {user.first_name} {user.last_name}</ChakraText>
                  <ChakraText fontSize="sm">조직: {user.organization_name || user.organization_id || '-'}</ChakraText>
                </Stack>
              ))}
            </Stack>
            <Stack padding={3} backgroundColor="var(--blue-50)" borderRadius="md" border="1px solid var(--blue-200)">
              <ChakraText fontSize="sm" color="var(--blue-800)">
                총 {csvData?.rows.length}명의 사용자가 생성됩니다.
              </ChakraText>
            </Stack>
          </Stack>
        );
      
      case Step.CREATING:
        return (
          <Stack gap={4}>
            <Text variant="body" fontWeight="bold">사용자 생성 중...</Text>
            <Stack gap={2}>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--grey-200)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${creationProgress}%`,
                  height: '100%',
                  backgroundColor: 'var(--blue-500)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <ChakraText fontSize="sm" textAlign="center">
                {creationProgress}% 완료
              </ChakraText>
              {currentEmail && (
                <ChakraText fontSize="sm" textAlign="center" color="var(--grey-600)">
                  처리 중: {currentEmail}
                </ChakraText>
              )}
            </Stack>
          </Stack>
        );
      
      case Step.RESULT:
        return creationResult ? (
          <Stack gap={4}>
            <Text variant="body" fontWeight="bold">생성 결과</Text>
            <Stack gap={2}>
              <ChakraText>총 사용자: {creationResult.total}명</ChakraText>
              <ChakraText color="green.500">성공: {creationResult.created}명</ChakraText>
              <ChakraText color="red.500">실패: {creationResult.failed}명</ChakraText>
              <ChakraText color="orange.500">중복 스킵: {creationResult.skipped}명</ChakraText>
            </Stack>
            {creationResult.skippedUsers && creationResult.skippedUsers.length > 0 && (
              <Stack gap={2}>
                <Text variant="body" fontWeight="bold">중복된 이메일:</Text>
                <Stack gap={1} maxHeight="150px" overflowY="auto">
                  {creationResult.skippedUsers.map((skipped, index) => (
                    <ChakraText key={index} fontSize="sm" color="orange.500">
                      행 {skipped.row} ({skipped.email}): {skipped.reason}
                    </ChakraText>
                  ))}
                </Stack>
              </Stack>
            )}
            {creationResult.errors.length > 0 && (
              <Stack gap={2}>
                <Text variant="body" fontWeight="bold">오류 목록:</Text>
                <Stack gap={1} maxHeight="150px" overflowY="auto">
                  {creationResult.errors.map((error, index) => (
                    <ChakraText key={index} fontSize="sm" color="red.500">
                      행 {error.row} ({error.email}): {error.error}
                    </ChakraText>
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        ) : null;
      
      default:
        return null;
    }
  };

  const renderButtons = () => {
    switch (step) {
      case Step.UPLOAD:
        return (
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
        );
      
      case Step.MAPPING:
        return (
          <Stack direction="row" gap={2}>
            <Button variant="outline" onClick={() => setStep(Step.UPLOAD)}>
              이전
            </Button>
            <Button colorScheme="blue" onClick={handleMappingComplete}>
              다음
            </Button>
          </Stack>
        );
      
      case Step.PREVIEW:
        return (
          <Stack direction="row" gap={2}>
            <Button variant="outline" onClick={() => setStep(Step.MAPPING)}>
              이전
            </Button>
            <Button colorScheme="blue" onClick={handleCreateUsers}>
              사용자 생성
            </Button>
          </Stack>
        );
      
      case Step.CREATING:
        return (
          <Button disabled>
            생성 중...
          </Button>
        );
      
      case Step.RESULT:
        return (
          <Stack direction="row" gap={2}>
            <Button variant="outline" onClick={resetModal}>
              다시 시작
            </Button>
            <Button colorScheme="blue" onClick={handleClose}>
              완료
            </Button>
          </Stack>
        );
      
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <Stack gap={6}>
        <Text variant="body" fontWeight="bold">CSV로 사용자 일괄 생성</Text>
        
        {renderStepContent()}
        
        <Stack direction="row" justifyContent="flex-end">
          {renderButtons()}
        </Stack>
      </Stack>
    </Modal>
  );
}