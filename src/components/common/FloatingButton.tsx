import styled from "@emotion/styled";

type FloatingButtonPosition = "left" | "center" | "right";

type FloatingButtonProps = {
  onClick: () => void;
  children?: React.ReactNode;
  bottom?: number;
  position?: FloatingButtonPosition;
};

export function FloatingButton({ 
  onClick, 
  children, 
  bottom = 20, 
  position = "right" 
}: FloatingButtonProps) {
  return (
    <FloatingButtonContainer bottom={bottom} position={position}>
      <Button onClick={onClick} position={position}>
        {children}
      </Button>
    </FloatingButtonContainer>
  );
}

const FloatingButtonContainer = styled.div<{ 
  bottom: number; 
  position: FloatingButtonPosition;
}>`
  z-index: 990;
  position: fixed;
  bottom: ${({ bottom }) => bottom}px;
  
  ${({ position }) => {
    switch (position) {
      case "left":
        return `
          left: 20px;
        `;
      case "center":
        return `
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: var(--breakpoint-tablet);
          padding: 0 20px;
        `;
      case "right":
      default:
        return `
          right: 20px;
        `;
    }
  }}
`;

const Button = styled.button<{ position: FloatingButtonPosition }>`
  cursor: pointer;
  background-color: var(--primary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  gap: 8px;
  border-radius: 30px;
  ${({ position }) => position === "center" && `
    width: 100%;
  `}
  
  & > * {
    color: var(--white);
  }

  &:hover {
    opacity: 0.8;
  }
`;