import React, { useRef } from "react";
import styled from "@emotion/styled";
import { useState, useEffect } from "react";
interface Props {
  toggleButton: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
}

export default function Dropdown({
  toggleButton,
  children,
  isOpen = false,
}: Props) {
  const [open, setOpen] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <StyledContainer $open={open} ref={dropdownRef}>
      <button className="toggle" onClick={() => setOpen(!open)}>
        {toggleButton}
      </button>
      {open && <div className="pannel">{children}</div>}
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
      font-size: 1.5rem;
      fill: ${({ theme, $open }) => ($open ? theme.color.primary : "black")};
    }
  }

  .pannel {
    position: absolute;
    z-index: 10;
    top: 100%;
    right: 0;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 0.5rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
    justify-content: center;
    align-items: center;

    & > button {
      margin: 0, auto;
  }
}
`
