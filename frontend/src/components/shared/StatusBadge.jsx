const styles = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "bg-success/10 text-success dark:bg-successDark/10 dark:text-successDark",
  rejected: "bg-danger/10 text-danger dark:bg-dangerDark/10 dark:text-dangerDark",
};

export default function StatusBadge({ status }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || styles.pending}`}>
      {label}
    </span>
  );
}
