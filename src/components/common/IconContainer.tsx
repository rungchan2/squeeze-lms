import styles from "./IconContainer.module.css";

export function IconContainer({ children, padding, onClick }: { children: React.ReactNode, padding: string, onClick?: () => void }) {
  return <div className={styles.iconContainer} style={{ padding: padding }} onClick={onClick}>{children}</div>;
}