function round1(n) {
  return Math.round(n * 10) / 10;
}

// Segments are always 9 holes, so we apply half of each player's (18-hole) handicap.
function individualNet(grossScore, handicap) {
  if (grossScore === null || grossScore === undefined) return null;
  return round1(grossScore - (handicap || 0) / 2);
}

// For scramble / alternate shot, net is based on the average handicap of the foursome.
function groupNet(grossScore, handicaps) {
  if (grossScore === null || grossScore === undefined) return null;
  const avg = handicaps.reduce((sum, h) => sum + (h || 0), 0) / (handicaps.length || 1);
  return individualNet(grossScore, avg);
}

// players: foursome_players rows joined with name/team/partner_player_id
// scores: score rows for the foursome (player_id null for group formats)
function summarizeFoursome(format, players, scores) {
  if (format === 'scramble' || format === 'alternate_shot') {
    const s = scores[0];
    return s ? { groupGross: s.gross_score, groupNet: s.net_score } : null;
  }

  const scoreByPlayer = new Map(scores.map((s) => [s.player_id, s]));

  if (format === 'best_ball') {
    const pairSummary = (teamPlayers) => {
      const entries = teamPlayers.map((p) => scoreByPlayer.get(p.player_id)).filter(Boolean);
      if (entries.length === 0) return null;
      const bestGrossEntry = entries.reduce((a, b) => (a.gross_score <= b.gross_score ? a : b));
      const haveNet = entries.every((e) => e.net_score !== null && e.net_score !== undefined);
      const bestNetEntry = haveNet ? entries.reduce((a, b) => (a.net_score <= b.net_score ? a : b)) : null;
      return {
        bestGross: bestGrossEntry.gross_score,
        bestGrossPlayerId: bestGrossEntry.player_id,
        bestNet: bestNetEntry ? bestNetEntry.net_score : null,
        bestNetPlayerId: bestNetEntry ? bestNetEntry.player_id : null
      };
    };
    const teamA = pairSummary(players.filter((p) => p.team === 'A'));
    const teamB = pairSummary(players.filter((p) => p.team === 'B'));
    let leadingTeam = null;
    if (teamA && teamB) {
      const aVal = teamA.bestNet ?? teamA.bestGross;
      const bVal = teamB.bestNet ?? teamB.bestGross;
      if (aVal !== null && bVal !== null) leadingTeam = aVal < bVal ? 'A' : aVal > bVal ? 'B' : 'tie';
    }
    return { teamA, teamB, leadingTeam };
  }

  if (format === 'one_v_one') {
    const seen = new Set();
    const matchups = [];
    for (const p of players) {
      if (!p.partner_player_id || seen.has(p.player_id)) continue;
      const opponent = players.find((o) => o.player_id === p.partner_player_id);
      if (!opponent) continue;
      seen.add(p.player_id);
      seen.add(opponent.player_id);
      const pScore = scoreByPlayer.get(p.player_id) || null;
      const oScore = scoreByPlayer.get(opponent.player_id) || null;
      let winnerPlayerId = null;
      if (pScore && oScore) {
        const pVal = pScore.net_score ?? pScore.gross_score;
        const oVal = oScore.net_score ?? oScore.gross_score;
        if (pVal !== null && oVal !== null) {
          if (pVal < oVal) winnerPlayerId = p.player_id;
          else if (oVal < pVal) winnerPlayerId = opponent.player_id;
          else winnerPlayerId = 'tie';
        }
      }
      matchups.push({
        playerA: { id: p.player_id, name: p.name, team: p.team, score: pScore },
        playerB: { id: opponent.player_id, name: opponent.name, team: opponent.team, score: oScore },
        winnerPlayerId
      });
    }
    return { matchups };
  }

  return null;
}

module.exports = { round1, individualNet, groupNet, summarizeFoursome };
