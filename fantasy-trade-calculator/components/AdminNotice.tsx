export function AdminNotice() {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
      <strong>Heads up:</strong> these admin pages have no login yet. Anyone with the URL can
      edit data. Add auth before sharing this publicly.
    </div>
  );
}
