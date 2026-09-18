import type { SelectHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

export function Select({ options, value, onChange, placeholder, invalid, className, ...rest }: SelectProps) {
  return (
    <select
      className={cx(styles.select, invalid && styles.invalid, className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
