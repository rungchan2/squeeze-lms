import styles from "./Checkbox.module.css";
import { InputHTMLAttributes } from 'react';


export default function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input type="checkbox" className={styles.checkbox} {...props} />;
}
