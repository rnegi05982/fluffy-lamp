import type { ReactNode } from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className={styles.wrap} tabIndex={0}>
      {children}
      <span className={styles.bubble} role="tooltip">
        {text}
      </span>
    </span>
  );
}
