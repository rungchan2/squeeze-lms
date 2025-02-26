import styled from "@emotion/styled";
import Text from "./Text/Text";

export default function InputAndTitle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <InputTitleContainer>
      <Text variant="caption" color="var(--grey-500)">{title}</Text>
      {children}
    </InputTitleContainer>
  );
}

const InputTitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
`;
