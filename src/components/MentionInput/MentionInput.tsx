import React, { forwardRef, useImperativeHandle } from 'react';
import Document from '@tiptap/extension-document';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import { EditorContent, useEditor } from '@tiptap/react';
import styled from '@emotion/styled';
import suggestion from './Suggestion';

export interface MentionInputProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

export interface MentionInputRef {
  clear: () => void;
  focus: () => void;
}

const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(({
  content = '',
  onChange,
  placeholder = '',
  onKeyDown
}, ref) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak.configure({
        HTMLAttributes: {
          class: 'hard-break',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        renderLabel({ options, node }) {
          return `${node.attrs.first_name || node.attrs.label || node.attrs.id}`;
        },
        suggestion,
      }),
    ],
    content: content || `<p>${placeholder}</p>`,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Shift+Enter로 줄바꿈 처리
        if (event.key === 'Enter' && event.shiftKey) {
          editor?.commands.setHardBreak();
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  // ref를 통해 에디터 내용을 초기화할 수 있도록 함
  useImperativeHandle(ref, () => ({
    clear: () => {
      editor?.commands.setContent('<p></p>');
    },
    focus: () => {
      editor?.commands.focus();
    }
  }));

  if (!editor) {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // 커스텀 키 이벤트 처리
    if (onKeyDown) {
      onKeyDown(event);
    }
  };

  return (
    <MentionInputContainer>
      <StyledEditorContent editor={editor} onKeyDown={handleKeyDown} />
    </MentionInputContainer>
  );
});

MentionInput.displayName = 'MentionInput';

export default MentionInput;

const MentionInputContainer = styled.div`
  width: 100%;
  position: relative;
  border-bottom: 1px solid var(--grey-200);

  &:focus-within {
    border-bottom: 1px solid var(--primary-500);
  }
  
  .mention {
    background-color: var(--primary-100);
    border-radius: 0.3rem;
    color: var(--primary-700);
    font-weight: 500;
    padding: 0.1rem;
    white-space: nowrap;
  }
`;

const StyledEditorContent = styled(EditorContent)`
  .ProseMirror {
    outline: none;
    
    p {
      margin: 0.5rem 0;
    }
    
    &:focus {
      outline: none;
    }
  }
`; 