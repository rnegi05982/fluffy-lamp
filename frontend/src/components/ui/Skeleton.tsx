import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}

export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)' }: SkeletonProps) {
  return <span className={styles.skeleton} style={{ width, height, borderRadius: radius }} />;
}
