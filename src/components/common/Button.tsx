import { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "flat" | "outline";
  maxWidth?: number;
};

export default function Button(props: ButtonProps) {
  const { className, variant, maxWidth, ...rest } = props;
  return (
    <button
      {...rest}
      className={`${styles.button} ${className || ""} ${
        variant === "outline" ? styles.outline : ""
      }`}
      style={{ maxWidth: maxWidth ? `${maxWidth}px` : "100%" }}
    />
  );
}
