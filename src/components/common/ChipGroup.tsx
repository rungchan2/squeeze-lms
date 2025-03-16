"use client";

import styled from "@emotion/styled";
import Text from "@/components/Text/Text";

interface ChipGroupProps {
  options: string[];
  selectedOption: string;
  onSelect: (option: string) => void;
  className?: string;
}

export default function ChipGroup({
  options,
  selectedOption,
  onSelect,
  className,
}: ChipGroupProps) {
  return (
    <StyledChipGroup className={className}>
      {options.map((option) => (
        <Chip
          key={option}
          isSelected={selectedOption === option}
          onClick={() => onSelect(option)}
        >
          <Text variant="caption">{option}</Text>
        </Chip>
      ))}
    </StyledChipGroup>
  );
}

const StyledChipGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
`;

interface ChipProps {
  isSelected: boolean;
}

const Chip = styled.div<ChipProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 4px;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${({ isSelected }) =>
    isSelected ? "var(--primary-500)" : "var(--white)"};
  color: ${({ isSelected }) =>
    isSelected ? "var(--white)" : "var(--grey-700)"};
  border: 1px solid
    ${({ isSelected }) =>
      isSelected ? "var(--primary-500)" : "var(--grey-200)"};

  &:hover {
    background-color: ${({ isSelected }) =>
      isSelected ? "var(--primary-600)" : "var(--grey-100)"};
  }

  & > span {
    color: ${({ isSelected }) => (isSelected ? "var(--white)" : "inherit")};
    font-weight: ${({ isSelected }) => (isSelected ? "500" : "400")};
  }
`;
