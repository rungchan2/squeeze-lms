import styled from "@emotion/styled";

export function Error({ message }: { message: string }) {
  return (
    <ErrorContainer>
      <p>{message}</p>
    </ErrorContainer>
  );
}

const ErrorContainer = styled.div`
  min-height: 100px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--grey-500);
`;
