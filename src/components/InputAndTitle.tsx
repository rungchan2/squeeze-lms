import styled from "@emotion/styled";
import Text from "./Text/Text";
export default function InputAndTitle({ title, children, errorMessage }: { title: string; children: React.ReactNode, errorMessage?: string }) {
  return (
    <InputTitleContainer errorMessage={errorMessage}>
      <Text variant="caption" color="var(--grey-500)">{title}</Text>
      {children}
      {errorMessage && <Text variant="small" color="var(--negative-500)">{errorMessage}</Text>}
    </InputTitleContainer>
  );
}

const InputTitleContainer = styled.div<{ errorMessage?: string }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;

  input, 
  textarea,
  select {
    background-color: var(--white);
    border-color: ${props => props.errorMessage ? 'var(--negative-500)' : 'var(--grey-300)'};
    
    &:focus {
      border-color: ${props => props.errorMessage ? 'var(--negative-500)' : 'var(--primary-500)'};
      outline-color: ${props => props.errorMessage ? 'var(--negative-500)' : 'var(--primary-500)'};
    }
  }
`;
