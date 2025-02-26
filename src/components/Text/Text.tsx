import React from "react";
import styles from "./Text.module.css";

type TextProps = {
  variant?: "body" | "caption" | "small";
  children: React.ReactNode;
  className?: string;
  color?: string;
  weight?: "regular" | "medium" | "bold";
};

const Text = ({ variant = "body", children, className = "", color, weight = "regular" }: TextProps) => {
  const style = {
    color: color || "inherit",
    fontWeight: weight === "regular" ? 400 : weight === "medium" ? 500 : weight === "bold" ? 700 : undefined
  };

  return (
    <p 
      className={`${styles.text} ${styles[variant]} ${className}`.trim()} 
      style={style}
    >
      {children}
    </p>
  );
};

export default Text;