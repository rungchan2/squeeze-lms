import Text from "@/components/Text/Text";
import noJourney from "@/assets/no-journey.png";
import Image from "next/image";
import styled from "@emotion/styled";

export default function NoJourney() {
  return (
    <NoJourneyContainer>
      <Image 
        src={noJourney} 
        alt="no-journey" 
        width={150} 
        height={100} 
        priority 
        style={{ 
          width: 'auto', 
          height: 'auto', 
          objectFit: 'contain' 
        }} 
      />
      <Text variant="body" fontWeight="bold">
        아직 미션이 없습니다..!
      </Text>
    </NoJourneyContainer>
  );
}

const NoJourneyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
