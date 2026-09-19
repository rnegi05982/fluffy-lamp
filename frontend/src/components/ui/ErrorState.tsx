import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.box} role="alert">
      <AlertCircle className={styles.icon} size={18} />
      <span className={styles.message}>{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
