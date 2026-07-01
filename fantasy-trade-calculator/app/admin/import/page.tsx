import Link from "next/link";
import { AdminNotice } from "@/components/AdminNotice";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const runs = await prisma.importRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AdminNotice />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Import History</h1>
        <Link
          href="/admin"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          ← Players
        </Link>
      </div>

      {/* FantasyCalc */}
      <div className="glass-card flex flex-col gap-2 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white/85">FantasyCalc</h2>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "rgba(110, 231, 183, 0.90)",
            }}
          >
            recommended
          </span>
        </div>
        <p className="text-sm text-white/50">
          Pulls market-consensus values derived from 2.6M+ real trades. Free public API, no
          configuration needed. Runs automatically every day at 7am UTC.
        </p>
        <p className="text-sm text-white/50">
          To run manually:{" "}
          <code
            className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-white/70"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            npm run import:fantasycalc
          </code>
        </p>
      </div>

      {/* Sleeper */}
      <div className="glass-card flex flex-col gap-2 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white/85">Sleeper leagues</h2>
        <p className="text-sm text-white/50">
          Pulls trades from your own Sleeper leagues and applies a small nudge on top of the base
          values. Useful for personalizing to your league&apos;s trade market. Requires setup.
        </p>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-white/50">
          <li>
            Find your league IDs:{" "}
            <code
              className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-white/70"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              npm run find-leagues &lt;your-sleeper-username&gt;
            </code>
          </li>
          <li>
            Add{" "}
            <code
              className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-white/70"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              SLEEPER_LEAGUE_IDS
            </code>{" "}
            to your GitHub Actions secrets (Settings → Secrets → Actions).
          </li>
          <li>
            The{" "}
            <code
              className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-white/70"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              sleeper-import
            </code>{" "}
            workflow then runs every Monday at 6am UTC, or trigger it manually.
          </li>
        </ol>
      </div>

      {/* Run history */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white/55 uppercase tracking-wider">
          Recent runs
        </h2>
        <div className="glass-card flex flex-col divide-glass rounded-2xl">
          {runs.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-white/35">No import runs yet.</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="flex flex-col gap-1 px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <SourceBadge source={run.source} />
                    <span className="text-sm text-white/65">
                      {run.startedAt.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <StatusBadge status={run.status} />
                </div>
                {run.summary && (
                  <p className="text-xs text-white/35">{run.summary}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = {
    fantasycalc: "FantasyCalc",
    sleeper: "Sleeper",
    keeptradecut: "KTC",
  };
  return (
    <span
      className="rounded-lg px-2 py-0.5 font-mono text-xs text-white/60"
      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {labels[source] ?? source}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    success: {
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(16, 185, 129, 0.22)",
      color: "rgba(110, 231, 183, 0.88)",
    },
    error: {
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.22)",
      color: "rgba(252, 165, 165, 0.88)",
    },
    running: {
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.22)",
      color: "rgba(253, 211, 77, 0.88)",
    },
  };
  const s = styles[status] ?? {
    bg: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.10)",
    color: "rgba(255,255,255,0.55)",
  };
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {status}
    </span>
  );
}