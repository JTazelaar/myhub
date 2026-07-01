import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4">
        <div className="glass flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-2xl">
          🏈
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Fantasy Trade{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Calculator
            </span>
          </h1>
          <p className="mt-3 text-base text-white/50">
            Compare players, check trades, and track value over the season.
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/calculator"
          className="flex items-center justify-center gap-2.5 rounded-2xl px-6 py-5 text-base font-semibold text-white transition-all hover:scale-[1.015] active:scale-[0.98]"
          style={{
            background: "rgba(59, 130, 246, 0.18)",
            border: "1px solid rgba(59, 130, 246, 0.32)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            boxShadow: "0 12px 36px rgba(59, 130, 246, 0.20), inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        >
          <span className="text-xl">📊</span>
          Trade Calculator
        </Link>

        <Link
          href="/vote"
          className="flex items-center justify-center gap-2.5 rounded-2xl px-6 py-5 text-base font-semibold text-white transition-all hover:scale-[1.015] active:scale-[0.98]"
          style={{
            background: "rgba(139, 92, 246, 0.17)",
            border: "1px solid rgba(139, 92, 246, 0.30)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            boxShadow: "0 12px 36px rgba(139, 92, 246, 0.18), inset 0 1px 0 rgba(255,255,255,0.14)",
          }}
        >
          <span className="text-xl">⚡</span>
          Vote: Player vs Player
        </Link>

        <Link
          href="/admin"
          className="glass flex items-center justify-center gap-2.5 rounded-2xl px-6 py-5 text-base font-semibold text-white/60 transition-all hover:text-white/90 hover:scale-[1.015] active:scale-[0.98]"
        >
          <span className="text-xl">⚙️</span>
          Admin
        </Link>
      </div>
    </div>
  );
}
