import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PLAYERS = [
  { name: "Christian McCaffrey", position: "RB", team: "SF", value: 99 },
  { name: "Justin Jefferson", position: "WR", team: "MIN", value: 96 },
  { name: "Tyreek Hill", position: "WR", team: "MIA", value: 95 },
  { name: "Patrick Mahomes", position: "QB", team: "KC", value: 90 },
  { name: "Ja'Marr Chase", position: "WR", team: "CIN", value: 88 },
  { name: "Josh Allen", position: "QB", team: "BUF", value: 85 },
  { name: "Bijan Robinson", position: "RB", team: "ATL", value: 82 },
  { name: "Travis Kelce", position: "TE", team: "KC", value: 78 },
  { name: "Joe Burrow", position: "QB", team: "CIN", value: 65 },
  { name: "DeVonta Smith", position: "WR", team: "PHI", value: 62 },
  { name: "Kenneth Walker III", position: "RB", team: "SEA", value: 58 },
  { name: "Mark Andrews", position: "TE", team: "BAL", value: 55 },
  { name: "Trey McBride", position: "TE", team: "ARI", value: 45 },
  { name: "Tank Dell", position: "WR", team: "HOU", value: 42 },
  { name: "Jaylen Warren", position: "RB", team: "PIT", value: 38 },
  { name: "Gus Edwards", position: "RB", team: "LAC", value: 33 },
  { name: "Khalil Shakir", position: "WR", team: "BUF", value: 28 },
  { name: "Roschon Johnson", position: "RB", team: "CHI", value: 22 },
];

async function main() {
  const snapshot = await prisma.rankingSnapshot.upsert({
    where: { season_week: { season: 2026, week: 1 } },
    update: {},
    create: { season: 2026, week: 1, label: "2026 Week 1 (seed data)", notes: "Illustrative starter values." },
  });
  for (const p of PLAYERS) {
    const player = await prisma.player.upsert({
      where: { name: p.name },
      update: { position: p.position, team: p.team },
      create: { name: p.name, position: p.position, team: p.team },
    });
    await prisma.playerValue.upsert({
      where: { playerId_snapshotId: { playerId: player.id, snapshotId: snapshot.id } },
      update: { value: p.value },
      create: { playerId: player.id, snapshotId: snapshot.id, value: p.value },
    });
  }
  console.log(`Seeded ${PLAYERS.length} players.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
