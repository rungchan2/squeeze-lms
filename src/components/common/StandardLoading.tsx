import Spinner from "@/components/common/Spinner";
import styled from "@emotion/styled";
import Text from "@/components/Text/Text";

export default function StandardLoading(text: string) {
  return (
    <>
    <Container>
        <Spinner size="xl" />
        <Text variant="body" weight="medium" style={{ marginTop: "16px" }}>
          {text}
        </Text>
      </Container>
    </>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;