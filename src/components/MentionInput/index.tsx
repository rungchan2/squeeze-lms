import { FC, useEffect } from 'react'
import { Editor, EditorContent, useEditor } from '@tiptap/react'
import Mention from '@tiptap/extension-mention'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import suggestionConfig, { setJourneyContext } from './Suggestion'

interface MentionInputProps {
  content: string
  setContent: (content: string) => void
  readOnly?: boolean
  placeholder?: string
  className?: string
  journeyId?: string
}

const MentionInput: FC<MentionInputProps> = ({
  content,
  setContent,
  readOnly = false,
  placeholder,
  className = '',
  journeyId,
}) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: suggestionConfig as any,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    editable: !readOnly,
  })

  useEffect(() => {
    if (journeyId) {
      setJourneyContext(journeyId)
    }
  }, [journeyId])

  return (
    <div className={`relative rounded-lg border-gray-300 ${className}`}>
      <EditorContent
        editor={editor}
        className={`p-2 min-h-[80px] focus:outline-none rounded-lg ${
          readOnly ? 'var(--gray-50)' : 'var(--gray-100)'
        }`}
      />
      {placeholder && !editor?.isEmpty && (
        <div className="absolute top-2 left-2 text-gray-400">{placeholder}</div>
      )}
    </div>
  )
}

export default MentionInput 