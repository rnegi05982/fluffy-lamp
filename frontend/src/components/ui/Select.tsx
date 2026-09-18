import type { SelectHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options?: SelectOption[];
  groups?: SelectGroup[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

export function Select({ options, groups, value, onChange, placeholder, invalid, className, ...rest }: SelectProps) {
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
      {groups
        ? groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))
        : (options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
    </select>
  );
}
