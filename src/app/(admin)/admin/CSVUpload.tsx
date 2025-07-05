import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { parse } from "csv-parse";
import { Stack, Button, Text as ChakraText } from "@chakra-ui/react";
import { FaUpload, FaDownload } from "react-icons/fa";
import Text from "@/components/Text/Text";
import styled from "@emotion/styled";

interface CSVUploadProps {
  onUpload: (data: { headers: string[]; rows: string[][] }) => void;
}

const DropzoneContainer = styled.div<{ isDragActive: boolean }>`
  border: 2px dashed ${props => props.isDragActive ? 'var(--blue-500)' : 'var(--grey-300)'};
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  background-color: ${props => props.isDragActive ? 'var(--blue-50)' : 'var(--grey-50)'};
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--blue-400);
    background-color: var(--blue-50);
  }
`;

export default function CSVUpload({ onUpload }: CSVUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSVFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      
      // Parse CSV with proper options
      const records = await new Promise<string[][]>((resolve, reject) => {
        parse(text, {
          skip_empty_lines: true,
          trim: true,
          encoding: 'utf8',
        }, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });

      if (records.length < 2) {
        throw new Error('CSV 파일에 최소 2행(헤더 + 데이터)이 필요합니다.');
      }

      const headers = records[0];
      const rows = records.slice(1);

      if (headers.length === 0) {
        throw new Error('CSV 헤더를 찾을 수 없습니다.');
      }

      if (rows.length === 0) {
        throw new Error('CSV 데이터를 찾을 수 없습니다.');
      }

      onUpload({ headers, rows });
    } catch (error) {
      console.error('CSV parsing error:', error);
      setError(error instanceof Error ? error.message : 'CSV 파일 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [onUpload]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('CSV 파일만 업로드 가능합니다.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      parseCSVFile(file);
    },
    [parseCSVFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const downloadSampleCSV = () => {
    const sampleData = [
      ['email', 'password', 'first_name', 'last_name', 'phone', 'organization_name'],
      ['user1@example.com', 'password123', '홍', '길동', '010-1234-5678', '테스트 대학교'],
      ['user2@example.com', 'password123', '김', '영희', '010-9876-5432', '테스트 대학교'],
      ['user3@example.com', 'password123', '이', '철수', '010-1111-2222', '테스트 대학교'],
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Stack gap={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Text variant="body" fontWeight="bold">CSV 파일 업로드</Text>
        <Button
          size="sm"
          variant="outline"
          onClick={downloadSampleCSV}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <FaDownload />
            <span>샘플 다운로드</span>
          </Stack>
        </Button>
      </Stack>

      <Stack gap={1} padding={3} backgroundColor="var(--blue-50)" borderRadius="md" border="1px solid var(--blue-200)">
        <ChakraText fontSize="sm" fontWeight="medium" color="var(--blue-800)">
          CSV 파일 형식 안내:
        </ChakraText>
        <ChakraText fontSize="sm" color="var(--blue-700)">
          • 필수 컬럼: email, password, first_name, last_name
        </ChakraText>
        <ChakraText fontSize="sm" color="var(--blue-700)">
          • 선택 컬럼: phone, organization_name (또는 organization_id)
        </ChakraText>
        <ChakraText fontSize="sm" color="var(--blue-700)">
          • 모든 사용자는 일반 사용자(학생) 권한으로 생성됩니다
        </ChakraText>
      </Stack>

      <DropzoneContainer isDragActive={isDragActive}>
        <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Stack gap={3} alignItems="center">
          <FaUpload size={32} color="var(--blue-500)" />
          {isDragActive ? (
            <ChakraText>CSV 파일을 여기에 놓으세요...</ChakraText>
          ) : (
            <Stack gap={1} textAlign="center">
              <ChakraText fontWeight="medium">
                CSV 파일을 드래그하거나 클릭하여 업로드하세요
              </ChakraText>
              <ChakraText fontSize="sm" color="var(--grey-600)">
                최대 10MB, .csv 파일만 지원
              </ChakraText>
            </Stack>
          )}
        </Stack>
        </div>
      </DropzoneContainer>

      {isLoading && (
        <ChakraText textAlign="center" color="var(--blue-500)">
          CSV 파일을 처리하고 있습니다...
        </ChakraText>
      )}

      {error && (
        <Stack padding={3} backgroundColor="var(--red-50)" borderRadius="md" border="1px solid var(--red-200)">
          <ChakraText fontSize="sm" color="var(--red-800)">{error}</ChakraText>
        </Stack>
      )}
    </Stack>
  );
}