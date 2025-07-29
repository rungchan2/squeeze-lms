import { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";
import Spinner from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "flat" | "outline" | "plain";
  maxWidth?: number;
  isLoading?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
};

export default function Button(props: ButtonProps) {
  const { className, variant, maxWidth, isLoading, disabled, style, ...rest } = props;
  return (
    <button 
      disabled={isLoading || disabled}
      style={{
        backgroundColor: isLoading || disabled ? "var(--grey-500)" : undefined,
        cursor: isLoading || disabled ? "not-allowed" : "pointer",
        maxWidth: maxWidth ? `${maxWidth}px` : "100%",
        width: "100%",
        ...style,
      }}
      {...rest}
      className={`${styles.button} ${className || ""} ${
        variant === "outline" ? styles.outline : variant === "plain" ? styles.plain : variant === "flat" ? styles.flat : ""
      }`}
    >
      {isLoading ? <Spinner size="20px" /> : rest.children}
    </button>
  );
}
