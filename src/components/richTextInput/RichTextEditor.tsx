import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import styled from "@emotion/styled";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import {
  FaAlignCenter,
  FaAlignJustify,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaHighlighter,
  FaItalic,
  FaStrikethrough,
  FaUnderline,
  FaImage,
} from "react-icons/fa";
import { Modal } from "../modal/Modal";
import FileUpload from "../common/FileUpload";

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar = ({ editor }: MenuBarProps) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const controlGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (controlGroupRef.current) {
        const { top } = controlGroupRef.current.getBoundingClientRect();
        setIsSticky(top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!editor) {
    return null;
  }

  const handleImageUpload = (imageUrl: string) => {
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setIsImageModalOpen(false);
  };

  const options = [
    {
      icon: <LuHeading1 />,
      label: "Heading 1",
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: <LuHeading2 />,
      label: "Heading 2",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: <LuHeading3 />,
      label: "Heading 3",
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
    {
      icon: <FaBold />,
      label: "Bold",
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: <FaItalic />,
      label: "Italic",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: <FaUnderline />,
      label: "Underline",
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      icon: <FaStrikethrough />,
      label: "Strikethrough",
      onClick: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    {
      icon: <FaHighlighter />,
      label: "Highlight",
      onClick: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive("highlight"),
    },
    {
      icon: <FaImage />,
      label: "Image",
      onClick: () => setIsImageModalOpen(true),
      isActive: editor.isActive("image"),
    },
    {
      icon: <FaAlignLeft />,
      label: "Align Left",
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
    },
    {
      icon: <FaAlignCenter />,
      label: "Align Center",
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
    },
    {
      icon: <FaAlignRight />,
      label: "Align Right",
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
    },
    {
      icon: <FaAlignJustify />,
      label: "Align Justify",
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editor.isActive({ textAlign: "justify" }),
    },
  ];

  return (
    <ControlGroup ref={controlGroupRef} $isSticky={isSticky}>
      <ButtonGroup $isSticky={isSticky}>
        {options.map((option) => (
          <Button
            key={option.label}
            onClick={option.onClick}
            isActive={option.isActive}
            title={option.label}
          >
            {option.icon}
          </Button>
        ))}
      </ButtonGroup>

      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      >
        <ModalContent>
          <h3>이미지 업로드</h3>
          <FileUpload
            onUploadComplete={handleImageUpload}
            placeholder="이미지를 드래그하거나 클릭하여 업로드하세요"
            height="250px"
          />
        </ModalContent>
      </Modal>
    </ControlGroup>
  );
};

const RichTextEditor = ({
  placeholder,
  style,
  onChange,
}: {
  placeholder: string;
  style?: React.CSSProperties;
  content: string;
  onChange: (value: string) => void;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Image,
      Underline,
    ],
    content: `
      <p>
        ${placeholder}
      </p>
    `,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <EditorContainer style={style}>
      <MenuBar editor={editor} />
      <StyledContent editor={editor} />
    </EditorContainer>
  );
};

export default RichTextEditor;

const EditorContainer = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  position: relative;

  .ProseMirror {
  background-color: var(--white);
  border: 1px solid var(--grey-300);
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;

  &:focus {
    border-color: var(--primary-500);
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 143, 43, 0.2);
  }
}
`;

const ControlGroup = styled.div<{ $isSticky: boolean }>`
  position: sticky;
  z-index: 100;
  margin-bottom: 8px;
  top: 0px;
  transition: all 0.3s ease;
`;

const ButtonGroup = styled.div<{ $isSticky: boolean }>`
  border: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: 0.5rem;
  background-color: ${props => props.$isSticky ? 'var(--grey-50)' : 'var(--white)'};
  backdrop-filter: ${props => props.$isSticky ? 'blur(5px) saturate(180%)' : 'none'};
  transition: all 0.3s ease;
  box-shadow: ${props => props.$isSticky ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
`;

const Button = styled.button<{ isActive: boolean }>`
  background: ${(props) =>
    props.isActive ? "var(--grey-200)" : "var(--grey-50)"};
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  transition: background-color 0.2s;
  font-weight: ${(props) => (props.isActive ? "bold" : "normal")};

  &:hover {
    background-color: var(--grey-200);
  }
`;

const StyledContent = styled(EditorContent)`
  min-height: max(200px, 40dvh);

  .tiptap {
    min-height: max(200px, 40dvh);
    :first-child {
      margin-top: 0;
    }

    /* List styles */
    ul,
    ol {
      padding: 0 1rem;
      margin: 1.25rem 1rem 1.25rem 0.4rem;

      li p {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
      }
    }

    /* Heading styles */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      line-height: 1.1;
      margin-top: 2.5rem;
      text-wrap: pretty;
    }

    h1,
    h2 {
      margin-top: 3.5rem;
      margin-bottom: 1.5rem;
    }

    h1 {
      font-size: 1.4rem;
    }

    h2 {
      font-size: 1.2rem;
    }

    h3 {
      font-size: 1.1rem;
    }

    h4,
    h5,
    h6 {
      font-size: 1rem;
    }

    /* Code and preformatted text styles */
    code {
      background-color: #f3f0ff;
      border-radius: 0.4rem;
      color: #000;
      font-size: 0.85rem;
      padding: 0.25em 0.3em;
    }

    pre {
      background: #000;
      border-radius: 0.5rem;
      color: #fff;
      font-family: "JetBrainsMono", monospace;
      margin: 1.5rem 0;
      padding: 0.75rem 1rem;

      code {
        background: none;
        color: inherit;
        font-size: 0.8rem;
        padding: 0;
      }
    }

    mark {
      background-color: #faf594;
      border-radius: 0.4rem;
      box-decoration-break: clone;
      padding: 0.1rem 0.3rem;
    }

    blockquote {
      border-left: 3px solid #d1d5db;
      margin: 1.5rem 0;
      padding-left: 1rem;
    }

    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 2rem 0;
    }
  }
`;

const ModalContent = styled.div`
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
`;
