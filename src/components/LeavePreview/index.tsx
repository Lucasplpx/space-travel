import Link from 'next/link';
import styles from './preview.module.scss';

export default function LeavePreview() {
  return (
    <aside>
      <Link href="/api/exit-preview">
        <a className={styles.preview}>Sair do modo Preview</a>
      </Link>
    </aside>
  );
}
