"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import ChipSelector from "@/components/common/ChipSelector";
import ChipGroup from "@/components/common/ChipGroup";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";

export default function ChipsExamplePage() {
  const [recommendationOption, setRecommendationOption] = useState("Recommendation");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedFilter, setSelectedFilter] = useState("최신순");
  
  const categories = ["전체", "여행", "음식", "취미", "스포츠", "문화"];
  const filters = ["최신순", "인기순", "조회순", "댓글순"];

  return (
    <ExampleContainer>
      <Heading level={2}>칩 컴포넌트 예제</Heading>
      
      
      <Section>
        <Heading level={3}>ChipSelector</Heading>
        <Text variant="body" style={{ marginBottom: '16px' }}>
          라벨과 함께 사용할 수 있는 칩 선택기 컴포넌트입니다.
        </Text>
        <ChipSelector 
          label="카테고리"
          options={categories} 
          selectedOption={selectedCategory} 
          setSelectedOption={setSelectedCategory} 
        />
        <Text variant="small" style={{ marginTop: '8px' }}>
          선택된 카테고리: {selectedCategory}
        </Text>
      </Section>
      
      <Section>
        <Heading level={3}>ChipGroup</Heading>
        <Text variant="body" style={{ marginBottom: '16px' }}>
          간단한 칩 그룹 컴포넌트입니다.
        </Text>
        <ChipGroup 
          options={filters} 
          selectedOption={selectedFilter} 
          onSelect={setSelectedFilter} 
        />
        <Text variant="small" style={{ marginTop: '8px' }}>
          선택된 필터: {selectedFilter}
        </Text>
      </Section>
    </ExampleContainer>
  );
}

const ExampleContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
`;

const Section = styled.div`
  margin-top: 32px;
  padding: 24px;
  border: 1px solid var(--grey-200);
  border-radius: 8px;
`; 