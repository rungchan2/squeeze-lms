import styled from "@emotion/styled";
import { FaTimes } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ children, isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isFadeOut, setIsFadeOut] = useState(false);
  const handleOnClose = () => {
    setIsFadeOut(true);
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleOnClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handleOnClose();
    }
  };

  const handleAnimationEnd = () => {
    if (isFadeOut) {
      onClose();
      setIsFadeOut(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);
  
  if (!isOpen) return null;

  return createPortal(
    <StyledModal
      className={`${isFadeOut ? "fade-out" : "fade-in"}`}
      onClick={handleOverlayClick}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="modal-body" ref={modalRef}>
        <div className="modal-content">
          <div className="modal-scroll-container">
            {children}
          </div>
          <div className="modal-close" onClick={handleOnClose}>
            <FaTimes />
          </div>
        </div>
      </div>
    </StyledModal>,
    document.body
  );
}

const StyledModal = styled.div`
  @keyframes fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  &.fade-out {
    animation: fade-out 0.3s ease-in-out forwards;
  }

  &.fade-in {
    animation: fade-in 0.3s ease-in-out forwards;
  }
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.5);
  overflow: hidden;

  .modal-body {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 450px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;

    .modal-content {
      position: relative;
      background-color: var(--white);
      border-radius: 10px;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      
      .modal-scroll-container {
        overflow-y: auto;
        max-height: calc(90vh - 64px); /* 패딩 고려 */
        padding-right: 8px; /* 스크롤바 공간 확보 */
        
        /* 스크롤바 숨기기 */
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
        
        /* Chrome, Safari, Opera에서 스크롤바 숨기기 */
        &::-webkit-scrollbar {
          display: none;
        }
      }

      .modal-close {
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        padding: 4px;
        z-index: 10;

        &:hover {
          background-color: var(--grey-100);
          border-radius: 50%;
        }
      }
    }
  }
`;
