import { InputHTMLAttributes } from 'react';
import style from "./Input.module.css";

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={style.input} />;
}