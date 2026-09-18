import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cx } from '@/lib/cx';
import styles from './MultiSelectDropdown.module.css';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);

  return (
    <div className={styles.wrap} ref={ref}>
      <button type="button" className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        <span className={cx(styles.value, selected.length === 0 && styles.placeholder)}>
          {selected.length === 0 ? placeholder : selectedLabels.join(', ')}
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.panel}>
          {options.length === 0 ? (
            <div className={styles.empty}>No options</div>
          ) : (
            options.map((o) => (
              <button key={o.value} type="button" className={styles.option} onClick={() => toggle(o.value)}>
                <span className={cx(styles.box, selected.includes(o.value) && styles.checked)}>
                  {selected.includes(o.value) && <Check size={12} />}
                </span>
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
