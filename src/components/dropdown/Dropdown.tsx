import React, { useRef } from "react";
import styled from "@emotion/styled";
import { useState, useEffect } from "react";
interface Props {
  toggleButton: React.ReactNode;
  items: React.ReactNode[];
  isOpen?: boolean;
}

export default function Dropdown({
  toggleButton,
  items,
  isOpen = false,
}: Props) {
  const [open, setOpen] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <StyledContainer $open={open} ref={dropdownRef}>
      <button
        className="toggle"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {toggleButton}
      </button>
      {open && (
        <div className="pannel">
          {items.map((item, index) => (
            <div className="item" key={index}>
              {item}
            </div>
          ))}
        </div>
      )}
    </StyledContainer>
  );
}

interface StyledProps {
  $open: boolean;
}

const StyledContainer = styled.div<StyledProps>`
  position: relative;

  .toggle {
    background: none;
    border: none;
    cursor: pointer;

    svg {
      fill: ${({ $open }) =>
        $open ? "var(--primary-700)" : "var(--grey-500)"};
    }
  }

  .pannel {
    position: absolute;
    display: flex;
    flex-direction: column;
    min-width: 100px;
    z-index: 10;
    top: 100%;
    right: 0;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
    justify-content: center;
    align-items: center;
    text-align: center;

    & > button {
      margin: 0, auto;
    }

    .item {
      cursor: pointer;
      width: 100%;
      padding: 6px 0;
      &:hover {
        background-color: var(--grey-100);
      }
    }
    .item:last-child {
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }
    .item:first-child {
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }
  }
`;
