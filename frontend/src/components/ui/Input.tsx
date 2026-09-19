import type { InputHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...rest }: InputProps) {
  return <input className={cx(styles.input, invalid && styles.invalid, className)} {...rest} />;
}
