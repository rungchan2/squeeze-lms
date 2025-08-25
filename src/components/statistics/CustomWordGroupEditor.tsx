"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { Button } from "@chakra-ui/react";
import Text from "@/components/Text/Text";
import { FaPlus, FaTrash, FaEdit, FaEye, FaEyeSlash } from "react-icons/fa";
import { toaster } from "@/components/ui/toaster";

import WordGroupEditModal from "./WordGroupEditModal";
import WordGroupAddModal from "./WordGroupAddModal";

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
  isHidden?: boolean;
}

interface CustomWordGroupEditorProps {
  wordFrequencies: WordFrequency[];
  customGroups: CustomWordGroup[];
  onGroupsChange: (groups: CustomWordGroup[]) => void;
  apiGroups?: CustomWordGroup[];
  onApiGroupsChange?: (groups: CustomWordGroup[]) => void;
}

export default function CustomWordGroupEditor({
  wordFrequencies,
  customGroups,
  onGroupsChange,
  apiGroups = [],
  onApiGroupsChange,
}: CustomWordGroupEditorProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CustomWordGroup | null>(null);

  // 모든 그룹 (API + 커스텀) 합치기
  const allGroups = [...apiGroups, ...customGroups];

  // Handle editing a group
  const handleEditGroup = (group: CustomWordGroup) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  // Handle saving edited group
  const handleSaveEditedGroup = (updatedGroup: CustomWordGroup) => {
    if (updatedGroup.isApiGroup) {
      // API 그룹 수정 시 총 카운트 재계산
      let totalCount = 0;
      const apiWordsData = updatedGroup.apiWordsData || [];
      
      updatedGroup.words.forEach(word => {
        const apiWordData = apiWordsData.find(w => w.word === word);
        if (apiWordData) {
          totalCount += apiWordData.frequency;
        } else {
          // 새로 추가된 단어는 wordFrequencies에서 찾기
          const wordData = wordFrequencies.find(item => item.word === word);
          totalCount += wordData?.count || 0;
          
          // apiWordsData에도 추가
          if (wordData) {
            apiWordsData.push({ word: word, frequency: wordData.count });
          }
        }
      });
      
      const updatedGroupWithCount = {
        ...updatedGroup,
        totalCount,
        apiWordsData
      };
      
      const updatedApiGroups = apiGroups.map(group => 
        group.id === updatedGroup.id ? updatedGroupWithCount : group
      );
      onApiGroupsChange?.(updatedApiGroups);
    } else {
      // 커스텀 그룹 수정 시 총 카운트 재계산
      let totalCount = 0;
      updatedGroup.words.forEach(word => {
        const wordData = wordFrequencies.find(item => item.word === word);
        totalCount += wordData?.count || 0;
      });
      
      const updatedGroupWithCount = {
        ...updatedGroup,
        totalCount
      };
      
      const updatedCustomGroups = customGroups.map(group => 
        group.id === updatedGroup.id ? updatedGroupWithCount : group
      );
      onGroupsChange(updatedCustomGroups);
    }

    toaster.create({
      title: "그룹이 수정되었습니다",
      type: "success",
    });
  };

  // Handle adding new group
  const handleAddGroup = (newGroup: CustomWordGroup) => {
    const updatedGroups = [...customGroups, newGroup];
    onGroupsChange(updatedGroups);
  };

  // Handle deleting group
  const handleDeleteGroup = (groupId: string) => {
    const group = allGroups.find(g => g.id === groupId);
    if (!group) return;

    if (group.isApiGroup) {
      toaster.create({
        title: "API 그룹은 삭제할 수 없습니다. 수정만 가능합니다.",
        type: "warning",
      });
      return;
    }

    if (window.confirm(`'${group.name}' 그룹을 삭제하시겠습니까?`)) {
      const updatedGroups = customGroups.filter(g => g.id !== groupId);
      onGroupsChange(updatedGroups);
      
      toaster.create({
        title: `'${group.name}' 그룹이 삭제되었습니다`,
        type: "info",
      });
    }
  };

  // Handle hiding/showing API group
  const handleToggleVisibility = (groupId: string) => {
    const group = apiGroups.find(g => g.id === groupId);
    if (!group) return;

    const updatedApiGroups = apiGroups.map(g => 
      g.id === groupId 
        ? { ...g, isHidden: !g.isHidden }
        : g
    );
    
    onApiGroupsChange?.(updatedApiGroups);
    
    toaster.create({
      title: group.isHidden ? `'${group.name}' 그룹이 표시됩니다` : `'${group.name}' 그룹이 숨겨집니다`,
      type: "info",
    });
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Text variant="body" fontWeight="bold">단어 그룹 관리</Text>
          <Text variant="caption" color="var(--grey-600)">
            AI가 생성한 그룹을 수정하거나 새로운 커스텀 그룹을 만들 수 있습니다.<br />
            AI 그룹은 👁️ 버튼으로 차트에서 숨기거나 표시할 수 있습니다.
          </Text>
        </HeaderContent>
        <AddButton
          onClick={() => setIsAddModalOpen(true)}
          colorScheme="blue"
          size="sm"
        >
          그룹 추가
        </AddButton>
      </Header>
      
      {/* Groups List */}
      {allGroups.length === 0 ? (
        <EmptyState>
          <Text variant="body" color="var(--grey-500)">
            아직 생성된 그룹이 없습니다.<br />
            단어들을 주제별로 그룹핑해보세요!
          </Text>
        </EmptyState>
      ) : (
        <GroupsList>
          {allGroups.map((group) => (
            <GroupItem 
              key={group.id} 
              $color={group.color} 
              $isApiGroup={group.isApiGroup}
              $isHidden={group.isHidden}
            >
              <GroupHeader>
                <GroupInfo $isHidden={group.isHidden}>
                  <ColorDot $color={group.color} />
                  <div>
                    <GroupTitle>
                      <Text variant="body" fontWeight="bold">{group.name}</Text>
                      {!group.isHidden && group.isApiGroup && (
                        <GroupBadge>
                          <Text variant="caption" color="var(--primary-600)">자동생성</Text>
                        </GroupBadge>
                      )}
                      {group.isHidden && (
                        <HiddenBadge>
                          <Text variant="caption" color="var(--warning-600)">숨겨짐</Text>
                        </HiddenBadge>
                      )}
                    </GroupTitle>
                    {!group.isHidden && (
                      <GroupMeta>
                        <Text variant="caption" color="var(--grey-600)">
                          {group.words.length}개 단어 · 총 빈도 {group.totalCount}
                        </Text>
                      </GroupMeta>
                    )}
                  </div>
                </GroupInfo>
                
                <GroupActions>
                  {!group.isHidden && (
                    <ActionButton onClick={() => handleEditGroup(group)}>
                      <FaEdit />
                    </ActionButton>
                  )}
                  {group.isApiGroup ? (
                    <ActionButton
                      onClick={() => handleToggleVisibility(group.id)}
                      $isHide={group.isHidden}
                      title={group.isHidden ? "그룹 보이기" : "그룹 숨기기"}
                    >
                      {group.isHidden ? <FaEyeSlash /> : <FaEye />}
                    </ActionButton>
                  ) : (
                    !group.isHidden && (
                      <ActionButton
                        onClick={() => handleDeleteGroup(group.id)}
                        $isDelete
                        title="그룹 삭제"
                      >
                        <FaTrash />
                      </ActionButton>
                    )
                  )}
                </GroupActions>
              </GroupHeader>
              
              <CollapseContent $isHidden={group.isHidden}>
                <WordsList>
                  {group.words.map((word, index) => {
                    let wordCount = 0;
                    
                    if (group.isApiGroup && group.apiWordsData) {
                      // API 그룹의 경우 저장된 빈도수 데이터 먼저 확인
                      const apiWordData = group.apiWordsData.find(w => w.word === word);
                      if (apiWordData) {
                        wordCount = apiWordData.frequency;
                      } else {
                        // apiWordsData에 없으면 wordFrequencies에서 찾기 (새로 추가된 단어)
                        const wordData = wordFrequencies.find(item => item.word === word);
                        wordCount = wordData?.count || 0;
                      }
                    } else {
                      // 커스텀 그룹의 경우 wordFrequencies에서 검색
                      const wordData = wordFrequencies.find(item => item.word === word);
                      wordCount = wordData?.count || 0;
                    }
                    
                    return (
                      <WordTag key={`${group.id}-${word}-${index}`}>
                        {word} ({wordCount})
                      </WordTag>
                    );
                  })}
                </WordsList>
              </CollapseContent>
            </GroupItem>
          ))}
        </GroupsList>
      )}

      {/* Add Group Modal */}
      <WordGroupAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        wordFrequencies={wordFrequencies}
        existingGroups={allGroups}
        onAdd={handleAddGroup}
      />

      {/* Edit Group Modal */}
      <WordGroupEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingGroup(null);
        }}
        group={editingGroup}
        wordFrequencies={wordFrequencies}
        existingGroups={allGroups}
        onSave={handleSaveEditedGroup}
      />
    </Container>
  );
}

const Container = styled.div`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AddButton = styled(Button)``;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  background: var(--grey-25);
  border-radius: 8px;
  border: 1px dashed var(--grey-300);
`;

const GroupsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GroupItem = styled.div<{ $color: string; $isApiGroup?: boolean; $isHidden?: boolean }>`
  background: var(--white);
  border: 1px solid var(--grey-200);
  border-left: 4px solid ${props => props.$color};
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  ${props => props.$isApiGroup && `
    background: var(--grey-25);
    border-color: var(--primary-200);
  `}
  
  ${props => props.$isHidden && `
    background: var(--grey-50);
    border-style: dashed;
    border-color: var(--warning-300);
    padding: 0.75rem 1rem;
    transform: scale(0.98);
  `}
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const GroupInfo = styled.div<{ $isHidden?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${props => props.$isHidden && `
    opacity: 0.7;
    transform: translateX(-8px);
  `}
`;

const ColorDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  background: ${props => props.$color};
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
`;

const GroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GroupBadge = styled.div`
  padding: 2px 6px;
  background: var(--primary-100);
  border-radius: 4px;
`;

const HiddenBadge = styled.div`
  padding: 2px 6px;
  background: var(--warning-100);
  border-radius: 4px;
`;

const GroupMeta = styled.div`
  margin-top: 0.25rem;
`;

const GroupActions = styled.div`
  display: flex;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Animate buttons sliding in/out */
  > * {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const ActionButton = styled.button<{ $isDelete?: boolean; $isHide?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--grey-100);
  color: ${props => {
    if (props.$isDelete) return 'var(--negative-500)';
    if (props.$isHide) return 'var(--warning-500)';
    return 'var(--grey-600)';
  }};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
  
  &:hover {
    background: ${props => {
      if (props.$isDelete) return 'var(--negative-100)';
      if (props.$isHide) return 'var(--warning-100)';
      return 'var(--primary-100)';
    }};
    color: ${props => {
      if (props.$isDelete) return 'var(--negative-600)';
      if (props.$isHide) return 'var(--warning-600)';
      return 'var(--primary-600)';
    }};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: ${props => props.$isHide ? 'rotate(10deg)' : 'none'};
  }
`;

const CollapseContent = styled.div<{ $isHidden?: boolean }>`
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
  
  ${props => props.$isHidden ? `
    max-height: 0;
    opacity: 0;
    transform: scaleY(0) translateY(-10px);
    margin-top: 0;
    overflow: hidden;
  ` : `
    max-height: 500px;
    opacity: 1;
    transform: scaleY(1) translateY(0);
    margin-top: 0.75rem;
  `}
`;

const WordsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const WordTag = styled.div`
  padding: 4px 8px;
  background: var(--grey-100);
  color: var(--grey-700);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;