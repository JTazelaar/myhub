export function AdminNotice() {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-sm text-amber-200"
      style={{
        background: "rgba(245, 158, 11, 0.10)",
        border: "1px solid rgba(245, 158, 11, 0.24)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <strong className="text-amber-100">Heads up:</strong> these admin pages have no login
      yet. Anyone with the URL can edit data. Add auth before sharing publicly.
    </div>
  );
}