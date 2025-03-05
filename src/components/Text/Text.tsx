import React from "react";
import styles from "./Text.module.css";

type TextProps = {
  variant?: "body" | "caption" | "small" | "little";
  children: React.ReactNode;
  className?: string;
  color?: string;
  weight?: "regular" | "medium" | "bold";
  onClick?: () => void;
  style?: React.CSSProperties;
  fontWeight?: "regular" | "medium" | "bold";
};

const Text = ({ variant = "body", children, className = "", color, onClick, style, fontWeight = "regular" }: TextProps) => {
  const textStyle = {
    color: color || "inherit",
    ...style,
    fontWeight: fontWeight || "regular",
  };

  return (
    <p 
      className={`${styles.text} ${styles[variant]} ${className}`.trim()} 
      style={textStyle}
      onClick={onClick}
    >
      {children}
    </p>
  );
};

export default Text;