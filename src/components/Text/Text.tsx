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
};

const Text = ({ variant = "body", children, className = "", color, weight = "regular", onClick, style }: TextProps) => {
  const textStyle = {
    color: color || "inherit",
    fontWeight: weight === "regular" ? 400 : weight === "medium" ? 500 : weight === "bold" ? 700 : undefined,
    ...style
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