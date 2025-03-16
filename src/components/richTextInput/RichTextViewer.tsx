import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import styled from "@emotion/styled";

interface RichTextViewerProps {
  content: string;
  style?: React.CSSProperties;
}

const RichTextViewer = ({ content, style }: RichTextViewerProps) => {
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
    content,
    editable: false,
  });

  return (
    <ViewerContainer style={style}>
      <StyledContent editor={editor} />
    </ViewerContainer>
  );
};

export default RichTextViewer;

const ViewerContainer = styled.div`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  position: relative;
`;

const StyledContent = styled(EditorContent)`
  .tiptap {
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
      margin-top: 1.5rem;
      text-wrap: pretty;
    }

    h1,
    h2 {
      margin-top: 2rem;
      margin-bottom: 1rem;
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