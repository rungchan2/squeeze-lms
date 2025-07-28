import styled from "@emotion/styled";

interface SpacingProps {
  height?: number;
}

export const Spacing = styled.div<SpacingProps>`
  height: ${({ height = 300 }) => height}px;
  width: 100%;
  flex-shrink: 0;
`;