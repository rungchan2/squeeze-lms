import JourneyClient from "./client";
import { Box, Button, Heading, Text, Flex } from "@chakra-ui/react";
import Link from "next/link";
import { getJourneyByUuid } from "./actions";

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function JourneyPage({ params }: Params) {
  try {
    // params 전체를 await
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const { data, error } = await getJourneyByUuid(slug);

  
    if (error) {
      console.error("[JourneyPage] 에러 발생:", error);
      // 에러가 발생했을 때 ErrorComponent 표시
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="100vh" 
          padding="4"
        >
          <Heading size="lg" marginBottom="4">여정을 찾을 수 없습니다</Heading>
          <Text marginBottom="6" color="gray.600">요청하신 여정이 존재하지 않거나 접근할 수 없습니다.</Text>
          <Link href="/" passHref>
            <Button as="a" colorScheme="blue">
              홈으로 돌아가기
            </Button>
          </Link>
        </Box>
      );
    }

    if (!data) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="100vh" 
          padding="4"
        >
          <Heading size="lg" marginBottom="4">여정 데이터를 찾을 수 없습니다</Heading>
          <Text marginBottom="6" color="gray.600">요청하신 여정의 데이터를 불러올 수 없습니다.</Text>
          <Link href="/" passHref>
            <Button as="a" colorScheme="blue">
              홈으로 돌아가기
            </Button>
          </Link>
        </Box>
      );
    }
      
    // 클라이언트 컴포넌트에 slug와 데이터 전달
    return <JourneyClient slug={slug} initialData={data} />;
    
  } catch (error) {
    console.error("[JourneyPage] 전체 오류:", error);
    
    // 심각한 오류 발생 시 에러 화면 표시
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="100vh" 
        padding="4"
      >
        <Heading size="lg" marginBottom="4">오류가 발생했습니다</Heading>
        <Text marginBottom="6" color="gray.600">요청을 처리하는 중 문제가 발생했습니다. 다시 시도해 주세요.</Text>
        <Link href="/" passHref>
          <Button as="a" colorScheme="blue">
            홈으로 돌아가기
          </Button>
        </Link>
      </Box>
    );
  }
}
