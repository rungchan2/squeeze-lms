import styled from "@emotion/styled";
type IconContainerProps = {
  children: React.ReactNode;
  padding?: string;
  onClick?: () => void;
  hoverColor?: string;
};
export function IconContainer({
  children,
  padding = "4px",
  onClick,
  hoverColor = "var(--grey-600)",
}: IconContainerProps) {
  return (
    <StyledIconContainer onClick={onClick} padding={padding} hoverColor={hoverColor}>
      {children}
    </StyledIconContainer>
  );
}

const StyledIconContainer = styled.div<IconContainerProps>`
    display: flex;
    gap: 5px;
    padding: ${({ padding }) => padding};
    cursor: pointer;
    width: fit-content;
    align-items: center;
    aspect-ratio: 1/1;
    border-radius: 50%;


  &:hover {
    background-color: var(--grey-200);
  }
  
  &:hover svg {
    color: ${({ hoverColor }) => hoverColor};
  }
`;
