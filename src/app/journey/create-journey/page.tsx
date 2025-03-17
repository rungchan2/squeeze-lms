import FileUpload from "@/components/common/FileUpload";
import styled from "@emotion/styled";
import { CreateJourney } from "@/types";
import { createJourney } from "../actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputAndTitle from "@/components/InputAndTitle";

export default function CreateJourneyPage() {
  return (
    <StyledContainer>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  margin: 0 auto;
  padding: 20px;
`;
