export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-green-700">
      <span className="text-4xl animate-bounce">🏌️</span>
      <p className="font-display">{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 px-5 py-4 text-center font-semibold">
      {message}
    </div>
  );
}
