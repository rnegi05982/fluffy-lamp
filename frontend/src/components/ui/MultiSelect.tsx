import { cx } from '@/lib/cx';
import styles from './MultiSelect.module.css';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  empty?: string;
}

export function MultiSelect({ options, selected, onChange, empty = 'No options' }: MultiSelectProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  if (options.length === 0) return <span className={styles.empty}>{empty}</span>;

  return (
    <div className={styles.chips}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cx(styles.chip, selected.includes(o.value) && styles.selected)}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
