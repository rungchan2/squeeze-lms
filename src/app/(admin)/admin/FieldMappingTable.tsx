import { Table, Stack } from "@chakra-ui/react";
import Text from "@/components/Text/Text";

interface FieldMappingTableProps {
  headers: string[];
  mapping: { [key: string]: string };
  onMappingChange: (mapping: { [key: string]: string }) => void;
}

const USER_FIELDS = [
  { value: '', label: '매핑하지 않음' },
  { value: 'email', label: '이메일 (필수)' },
  { value: 'password', label: '비밀번호 (필수)' },
  { value: 'first_name', label: '이름 (필수)' },
  { value: 'last_name', label: '성 (필수)' },
  { value: 'phone', label: '전화번호 (선택)' },
  { value: 'organization_name', label: '조직명 (선택)' },
  { value: 'organization_id', label: '조직 ID (선택)' },
];

export default function FieldMappingTable({
  headers,
  mapping,
  onMappingChange
}: FieldMappingTableProps) {
  const handleMappingChange = (csvColumn: string, userField: string) => {
    const newMapping = { ...mapping };
    
    // Remove previous mapping for this user field
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === userField && key !== csvColumn) {
        delete newMapping[key];
      }
    });
    
    // Set new mapping or remove if empty
    if (userField) {
      newMapping[csvColumn] = userField;
    } else {
      delete newMapping[csvColumn];
    }
    
    onMappingChange(newMapping);
  };

  const getAvailableFields = (currentColumn: string) => {
    const usedFields = Object.values(mapping).filter((field, index) => {
      const keys = Object.keys(mapping);
      return field && keys[index] !== currentColumn;
    });
    
    return USER_FIELDS.map(field => ({
      ...field,
      disabled: field.value !== '' && usedFields.includes(field.value)
    }));
  };

  return (
    <Stack gap={4}>
      <Text variant="body" fontWeight="bold">CSV 컬럼과 사용자 필드 매핑</Text>
      
      <Table.Root size="sm" variant="outline" backgroundColor="var(--white)">
        <Table.ColumnGroup>
          <Table.Column htmlWidth="40%" />
          <Table.Column htmlWidth="60%" />
        </Table.ColumnGroup>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>CSV 컬럼</Table.ColumnHeader>
            <Table.ColumnHeader>사용자 필드</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {headers.map((header, index) => (
            <Table.Row key={index}>
              <Table.Cell>
                <Text variant="body" fontWeight="medium">
                  {header}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <select
                  value={mapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--grey-300)',
                    backgroundColor: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="">필드 선택</option>
                  {getAvailableFields(header).map(field => (
                    <option 
                      key={field.value} 
                      value={field.value}
                      disabled={field.disabled}
                    >
                      {field.label}
                    </option>
                  ))}
                </select>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Stack gap={2} padding={3} backgroundColor="var(--grey-50)" borderRadius="md">
        <Text variant="caption" fontWeight="bold" color="var(--grey-700)">
          매핑 상태:
        </Text>
        <Stack gap={1}>
          {USER_FIELDS.filter(field => field.value && field.label.includes('필수')).map(field => {
            const isMapped = Object.values(mapping).includes(field.value);
            return (
              <Text
                key={field.value}
                variant="caption"
                color={isMapped ? 'var(--green-600)' : 'var(--red-600)'}
              >
                {field.label}: {isMapped ? '✓ 매핑됨' : '✗ 매핑 필요'}
              </Text>
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
}