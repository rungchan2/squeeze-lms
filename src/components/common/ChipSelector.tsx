"use client";
import styled from "@emotion/styled";
import Text from "@/components/Text/Text";

interface ChipSelectorProps {
  options: string[];
  selectedOption: string;
  setSelectedOption: (option: string) => void;
  label?: string;
}

export default function ChipSelector({
  options,
  selectedOption,
  setSelectedOption,
  label,
}: ChipSelectorProps) {
  return (
    <ChipSelectorContainer>
      {label && <Text variant="body" className="label">{label}</Text>}
      <ChipContainer>
        {options.map((option) => (
          <Chip
            key={option}
            isSelected={selectedOption === option}
            onClick={() => setSelectedOption(option)}
          >
            <Text variant="small">{option}</Text>
          </Chip>
        ))}
      </ChipContainer>
    </ChipSelectorContainer>
  );
}

const ChipSelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .label {
    font-weight: 500;
  }
`;

const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

interface ChipProps {
  isSelected: boolean;
}

const Chip = styled.div<ChipProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${({ isSelected }) => 
    isSelected ? "var(--primary-500)" : "var(--grey-100)"};
  color: ${({ isSelected }) => 
    isSelected ? "var(--white)" : "var(--grey-700)"};
  border: 1px solid ${({ isSelected }) => 
    isSelected ? "var(--primary-500)" : "var(--grey-200)"};
  
  &:hover {
    background-color: ${({ isSelected }) => 
      isSelected ? "var(--primary-600)" : "var(--grey-200)"};
  }
  
  & > span {
    color: ${({ isSelected }) => 
      isSelected ? "var(--white)" : "inherit"};
  }
`; 