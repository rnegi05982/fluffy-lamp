import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  onPage: (page: number) => void;
}

export function Pagination({ page, limit, total, hasMore, onPage }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className={styles.pagination}>
      <span className={styles.info}>
        Page {page} of {totalPages} · {total} total
      </span>
      <div className={styles.controls}>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </Button>
        <Button variant="secondary" size="sm" disabled={!hasMore} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
