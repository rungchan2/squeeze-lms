"use client";

import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { Input, Button } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import { FaSave, FaTimes } from "react-icons/fa";
import { toaster } from "@/components/ui/toaster";
import { Modal } from "@/components/modal/Modal";

export interface WordFrequency {
  word: string;
  count: number;
}

export interface CustomWordGroup {
  id: string;
  name: string;
  words: string[];
  color: string;
  totalCount: number;
  isApiGroup?: boolean;
  apiWordsData?: Array<{ word: string; frequency: number }>;
}

interface WordGroupEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: CustomWordGroup | null;
  wordFrequencies: WordFrequency[];
  existingGroups: CustomWordGroup[];
  onSave: (group: CustomWordGroup) => void;
}

export default function WordGroupEditModal({
  isOpen,
  onClose,
  group,
  wordFrequencies,
  existingGroups,
  onSave,
}: WordGroupEditModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  // Initialize form when group changes
  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setSelectedWords(group.words);
    } else {
      setGroupName("");
      setSelectedWords([]);
    }
  }, [group]);

  // Get available words (not already assigned to other groups)
  const getAvailableWords = () => {
    const assignedWords = new Set<string>();
    existingGroups.forEach(existingGroup => {
      if (existingGroup.id !== group?.id) {
        existingGroup.words.forEach(word => assignedWords.add(word));
      }
    });
    
    return wordFrequencies.filter(item => !assignedWords.has(item.word));
  };

  // Calculate total count for selected words
  const calculateGroupTotal = (words: string[]) => {
    return words.reduce((total, word) => {
      if (group?.isApiGroup && group.apiWordsData) {
        const apiWordData = group.apiWordsData.find(w => w.word === word);
        return total + (apiWordData?.frequency || 0);
      } else {
        const wordData = wordFrequencies.find(item => item.word === word);
        return total + (wordData?.count || 0);
      }
    }, 0);
  };

  const handleSave = () => {
    if (!groupName.trim()) {
      toaster.create({
        title: "그룹 이름을 입력해주세요",
        type: "warning",
      });
      return;
    }
    
    if (selectedWords.length === 0) {
      toaster.create({
        title: "최소 1개의 단어를 선택해주세요",
        type: "warning",
      });
      return;
    }

    if (!group) return;

    const updatedGroup: CustomWordGroup = {
      ...group,
      name: groupName.trim(),
      words: selectedWords,
      totalCount: calculateGroupTotal(selectedWords),
      // API 그룹의 경우 apiWordsData도 업데이트
      ...(group.isApiGroup && {
        apiWordsData: selectedWords.map(word => {
          const existingData = group.apiWordsData?.find(w => w.word === word);
          if (existingData) {
            return existingData;
          }
          const wordData = wordFrequencies.find(item => item.word === word);
          return {
            word,
            frequency: wordData?.count || 0
          };
        })
      })
    };

    onSave(updatedGroup);
    handleClose();
  };

  const handleClose = () => {
    setGroupName("");
    setSelectedWords([]);
    onClose();
  };

  const availableWords = getAvailableWords();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={group?.isApiGroup ? "API 그룹 수정" : "그룹 수정"}
      maxWidth="600px"
    >
      <FormContainer>
        <FormSection>
          <Text variant="body" fontWeight="bold" color="var(--grey-700)">
            그룹 이름
          </Text>
          <Input
            placeholder="그룹 이름 입력..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            size="sm"
          />
        </FormSection>

        <FormSection>
          <Text variant="body" fontWeight="bold" color="var(--grey-700)">
            단어 선택 ({availableWords.length}개 사용 가능)
          </Text>
          
          <WordGrid>
            {availableWords.map((item) => (
              <WordChip
                key={item.word}
                $isSelected={selectedWords.includes(item.word)}
                onClick={() => {
                  if (selectedWords.includes(item.word)) {
                    setSelectedWords(prev => prev.filter(w => w !== item.word));
                  } else {
                    setSelectedWords(prev => [...prev, item.word]);
                  }
                }}
              >
                <Text variant="caption" fontWeight="bold">
                  {item.word}
                </Text>
                <WordCount>
                  <Text variant="caption" color="var(--grey-500)">
                    {item.count}
                  </Text>
                </WordCount>
              </WordChip>
            ))}
          </WordGrid>
          
          {selectedWords.length > 0 && (
            <SelectedWordsPreview>
              <Text variant="caption" fontWeight="bold" color="var(--primary-600)">
                선택된 단어 ({selectedWords.length}개):
              </Text>
              <SelectedWordsList>
                {selectedWords.map((word, index) => {
                  let wordCount = 0;
                  if (group?.isApiGroup && group.apiWordsData) {
                    const apiWordData = group.apiWordsData.find(w => w.word === word);
                    wordCount = apiWordData?.frequency || 0;
                  } else {
                    const wordData = wordFrequencies.find(item => item.word === word);
                    wordCount = wordData?.count || 0;
                  }
                  
                  return (
                    <SelectedWordTag key={`selected-${word}-${index}`}>
                      {word} ({wordCount})
                    </SelectedWordTag>
                  );
                })}
              </SelectedWordsList>
              <Text variant="caption" color="var(--grey-600)">
                총 빈도수: {calculateGroupTotal(selectedWords)}
              </Text>
            </SelectedWordsPreview>
          )}
        </FormSection>
        
        <ModalActions>
          <Button
            leftIcon={<FaSave />}
            onClick={handleSave}
            colorScheme="blue"
            size="sm"
            mr={3}
          >
            수정
          </Button>
          <Button
            leftIcon={<FaTimes />}
            onClick={handleClose}
            variant="ghost"
            size="sm"
          >
            취소
          </Button>
        </ModalActions>
      </FormContainer>
    </Modal>
  );
}

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--grey-200);
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const WordGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: var(--grey-50);
  border-radius: 6px;
`;

const WordChip = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => props.$isSelected ? 'var(--primary-500)' : 'var(--white)'};
  color: ${props => props.$isSelected ? 'var(--white)' : 'var(--grey-800)'};
  border: 1px solid ${props => props.$isSelected ? 'var(--primary-500)' : 'var(--grey-300)'};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isSelected ? 'var(--primary-600)' : 'var(--primary-50)'};
    border-color: var(--primary-500);
  }
`;

const WordCount = styled.div``;

const SelectedWordsPreview = styled.div`
  padding: 12px;
  background: var(--primary-25);
  border-radius: 6px;
  border: 1px solid var(--primary-200);
`;

const SelectedWordsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 8px 0;
`;

const SelectedWordTag = styled.div`
  padding: 2px 6px;
  background: var(--primary-100);
  color: var(--primary-700);
  border-radius: 12px;
  font-size: 12px;
`;