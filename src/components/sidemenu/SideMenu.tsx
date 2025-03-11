"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import React from "react";
import styles from "./SideMenu.module.css";
import Text from "@/components/Text/Text";
import { IconContainer } from "../common/IconContainer";
import { IoClose } from "react-icons/io5";

interface MenuItemProps {
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface SideMenuProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  menuIcon?: React.ReactNode;
  width?: string;
}

const MenuItem = memo(({ children, icon, title, onClick }: MenuItemProps) => {
  return (
    <div className={styles.menuItem} onClick={onClick}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {title && <Text variant="caption">{title}</Text>}
      {children}
    </div>
  );
});

MenuItem.displayName = 'MenuItem';

const SideMenuContent = memo(({ 
  children, 
  isOpen, 
  onClose, 
  menuIcon,
  width = "300px" 
}: SideMenuProps) => {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (!isAnimating) {
      setShouldClose(true);
    }
  }, [isAnimating]);

  const handleAnimationStart = useCallback((e: React.AnimationEvent) => {
    if (e.animationName === styles.fadeOut) {
      setIsAnimating(true);
    }
  }, []);

  const handleAnimationEnd = useCallback((e: React.AnimationEvent) => {
    if (e.animationName === styles.fadeOut) {
      setIsAnimating(false);
      onClose();
      setShouldClose(false);
    }
  }, [onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || (!isOpen && !shouldClose)) return null;

  return (
    <div 
      className={`${styles.container} ${shouldClose ? styles.fadeOut : styles.fadeIn}`}
      onClick={handleOverlayClick}
      onAnimationStart={handleAnimationStart}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={styles.overlay} />
      <div 
        ref={menuRef}
        className={`${styles.sideMenu} ${shouldClose ? styles.closing : styles.opening}`}
        style={{ width }}
      >
        <div className={styles.menuHeader}>
          {menuIcon && <div className={styles.menuIcon}>{menuIcon}</div>}
          <IconContainer padding="5px" onClick={handleClose}>
            <IoClose />
          </IconContainer>
        </div>
        <div className={styles.menuContent} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
});

SideMenuContent.displayName = 'SideMenuContent';

function SideMenu(props: SideMenuProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) return null;
  
  return createPortal(
    <SideMenuContent {...props} />,
    document.body
  );
}

export { MenuItem, SideMenu };
