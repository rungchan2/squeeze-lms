import Text from "@/components/Text/Text";
import noJourney from "@/assets/no-journey.png";
import Image from "next/image";
import styled from "./Home.module.css"
export default function NoJourney() {
  return (
    <div className={styled.noJourney}>
      <Image src={noJourney} alt="no-journey" width={150} height={100} />
      <Text variant="body" fontWeight="bold">
        아직 여행이 없습니다..!
      </Text>
    </div>
  );
}
