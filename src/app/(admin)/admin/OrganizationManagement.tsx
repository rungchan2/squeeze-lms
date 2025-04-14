import { useState } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { Table, Button, Stack, Input } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { FaPlus, FaTrash } from "react-icons/fa";
import Text from "@/components/Text/Text";
import { Modal } from "@/components/modal/Modal";

export default function OrganizationManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    data: { useOrganizationList },
    actions: { createOrganization, deleteOrganization }
  } = useOrganization();
  
  const { organizations, mutate } = useOrganizationList();
  
  const handleCreate = async () => {
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
      setIsOpen(false);
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
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) {
      return;
    }
    
    try {
      await deleteOrganization(id);
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
    }
  };
  
  return (
    <Stack direction="column" marginTop={4}>
      <Stack direction="row" justify="space-between" marginBottom={4}>
        <Text variant="body" fontWeight="bold">소속 관리</Text>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => setIsOpen(true)}
        >
          <Stack direction="row" alignItems="center">
            <FaPlus />
            <span>새 소속 추가</span>
          </Stack>
        </Button>
      </Stack>
      
      <Table.Root size="sm" variant="outline" backgroundColor="var(--white)">
        <Table.ColumnGroup>
          <Table.Column htmlWidth="70%" />
          <Table.Column htmlWidth="30%" />
        </Table.ColumnGroup>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>소속명</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">관리</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {organizations?.map((org) => (
            <Table.Row key={org.id}>
              <Table.Cell>{org.name}</Table.Cell>
              <Table.Cell textAlign="end">
                <Button 
                  size="sm" 
                  colorScheme="red" 
                  variant="ghost"
                  onClick={() => handleDelete(org.id)}
                >
                  <Stack direction="row" alignItems="center">
                    <FaTrash />
                    <span>삭제</span>
                  </Stack>
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
          {organizations?.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={2} textAlign="center">
                등록된 소속이 없습니다
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
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
              onClick={() => setIsOpen(false)}
              marginRight={2}
            >
              취소
            </Button>
            <Button 
              size="sm"
              colorScheme="blue" 
              onClick={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? "처리 중..." : "추가"}
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Stack>
  );
}
