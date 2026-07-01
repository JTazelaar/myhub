"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm text-white/50">Something went wrong loading the page.</p>
      <button
        onClick={reset}
        className="rounded-full px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        style={{ border: "1px solid rgba(255,255,255,0.12)" }}
      >
        Try again
      </button>
    </div>
  );
}
