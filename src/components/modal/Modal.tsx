import { Dialog, Portal, CloseButton } from "@chakra-ui/react";
import styled from "@emotion/styled";

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
}

export function Modal({ children, isOpen, onClose, title, maxWidth = "650px" }: ModalProps) {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="md"
      placement="center"
      motionPreset="scale"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <StyledDialogContent maxWidth={maxWidth}>
            {title && (
              <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
              </Dialog.Header>
            )}
            <Dialog.Body>
              {children}
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </StyledDialogContent>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

const StyledDialogContent = styled(Dialog.Content)`
  /* 기존 스타일과 유사하게 오버라이드 */
  background-color: var(--white);
  border-radius: 10px;
  padding: 12px 0;
  width: 90%;
  max-width: ${({ maxWidth }) => maxWidth};
  max-height: 90vh;
  position: relative;
  
  /* Dialog.Header 스타일 */
  & > header {
    margin-bottom: 16px;
  }
  
  /* Dialog.Body 스타일 */
  & > div[data-part="body"] {
    overflow-y: auto;
    max-height: calc(90vh - 120px); /* 헤더와 패딩 고려 */
    padding-right: 8px;
    
    /* 스크롤바 숨기기 */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    
    /* Chrome, Safari, Opera에서 스크롤바 숨기기 */
    &::-webkit-scrollbar {
      display: none;
    }
  }
  
  /* CloseButton 위치 조정 */
  & > button[data-part="close-trigger"] {
    position: absolute;
    top: 10px;
    right: 10px;
  }
`;
