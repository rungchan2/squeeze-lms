import styles from "./IconContainer.module.css";

export function IconContainer({ children, padding }: { children: React.ReactNode, padding: string }) {
  return <div className={styles.iconContainer} style={{ padding: padding }}>{children}</div>;
}
