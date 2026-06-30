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
        <h1 className="text-2xl font-bold">Sleeper Import</h1>
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
          ← Players
        </Link>
      </div>

      {/* Setup instructions */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Setup</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          The import script pulls completed trades from your Sleeper leagues and nudges player
          values toward market consensus. Run it weekly via GitHub Actions.
        </p>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            Find your Sleeper league IDs:
            <code className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              npx tsx scripts/find-sleeper-leagues.ts &lt;your-username&gt;
            </code>
          </li>
          <li>
            Add{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              SLEEPER_LEAGUE_IDS
            </code>{" "}
            to your Vercel environment variables and GitHub Actions secrets.
          </li>
          <li>
            The{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              sleeper-import
            </code>{" "}
            GitHub Actions workflow runs automatically every Monday at 6am UTC.
          </li>
          <li>
            To run manually:{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              npm run import:sleeper
            </code>
          </li>
        </ol>
      </div>

      {/* Run history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Recent runs
        </h2>
        <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {runs.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">No import runs yet.</p>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {run.startedAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <StatusBadge status={run.status} />
                </div>
                {run.summary && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{run.summary}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    running: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-100 text-zinc-600"}`}
    >
      {status}
    </span>
  );
}
