import type { ReactNode } from 'react';
import { Skeleton } from './Skeleton';
import styles from './Table.module.css';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

/** Placeholder rows shown while a table's data is loading. */
export function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c}>
              <Skeleton />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** A single full-width row, e.g. to host an EmptyState inside a table. */
export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
}
