import { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
    const { className, ...rest } = props;
    return (
        <button 
            {...rest} 
            className={`${styles.button} ${className || ''}`}
        />
    );
}