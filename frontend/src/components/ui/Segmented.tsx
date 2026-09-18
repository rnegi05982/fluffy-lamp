import { cx } from '@/lib/cx';
import styles from './Segmented.module.css';

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

export function Segmented({ options, value, onChange }: SegmentedProps) {
  return (
    <div className={styles.seg} role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cx(styles.opt, value === o.value && styles.active)}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
