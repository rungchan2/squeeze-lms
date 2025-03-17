import styled from "@emotion/styled";
type FloatingButtonProps = {
  onClick: () => void;
  children?: React.ReactNode;
};

export function FloatingButton({ onClick, children }: FloatingButtonProps) {
  return (
    <FloatingButtonContainer>
      <Button onClick={onClick}>
        {children}
      </Button>
    </FloatingButtonContainer>
  );
}

const FloatingButtonContainer = styled.div`
  z-index: 990;
  position: fixed;
  bottom: 20px;
  right: 20px;
`;

const Button = styled.button`
  cursor: pointer;
  background-color: var(--primary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  gap: 8px;
  border-radius: 30px;
  & > * {
    color: var(--white);
  }

  &:hover {
    opacity: 0.8;
  }
`;