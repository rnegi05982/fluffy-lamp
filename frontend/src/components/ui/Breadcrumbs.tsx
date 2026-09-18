import { Home, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/cx';
import { useAppStore, type View } from '@/store/appStore';
import styles from './Breadcrumbs.module.css';

export interface Crumb {
  label?: string;
  view?: View;
  entityId?: string;
  home?: boolean;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        const clickable = Boolean(c.view) && !isLast;
        const content = c.home ? <Home size={15} /> : c.label;
        return (
          <span key={i} className={styles.item}>
            {i > 0 && <ChevronRight size={14} className={styles.sep} />}
            {clickable ? (
              <button
                type="button"
                className={styles.link}
                onClick={() => navigate(c.view as View, c.entityId ?? null)}
              >
                {content}
              </button>
            ) : (
              <span className={cx(styles.current, isLast && styles.last)}>{content}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
