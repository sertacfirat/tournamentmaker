import { Match, Player, StandingsRow, TeamStat, TournamentType, MatchTeam } from '../types';

// Helper to shuffle array
const shuffle = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Generate UUID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateFixtures = (
  players: Player[],
  type: TournamentType,
  isDoubleRound: boolean
): Match[] => {
  if (type === TournamentType.OneVsOne) {
    return generate1v1Fixtures(players, isDoubleRound);
  } else {
    return generate2v2Fixtures(players, isDoubleRound);
  }
};

const generate1v1Fixtures = (players: Player[], isDoubleRound: boolean): Match[] => {
  const matches: Match[] = [];
  const n = players.length;
  // Berger table / Round Robin
  const rounds = isDoubleRound ? (n - 1) * 2 : n - 1;

  // If odd number of players, add a dummy player
  const workingPlayers = [...players];
  if (n % 2 !== 0) {
    workingPlayers.push({ id: 'dummy', name: 'Bye' });
  }
  const totalPlayers = workingPlayers.length;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < totalPlayers / 2; i++) {
        const p1 = workingPlayers[i];
        const p2 = workingPlayers[totalPlayers - 1 - i];

        if (p1.id !== 'dummy' && p2.id !== 'dummy') {
            const isSecondHalf = round >= (totalPlayers - 1);
            let home = p1;
            let away = p2;

            if (isSecondHalf) {
               home = p2;
               away = p1;
            } else if (round % 2 === 1) {
               home = p2;
               away = p1;
            }

            matches.push({
                id: generateId(),
                round: round + 1,
                home: { playerIds: [home.id], score: null, footballTeam: '', isGhost: false },
                away: { playerIds: [away.id], score: null, footballTeam: '', isGhost: false },
                isCompleted: false,
                timestamp: Date.now()
            });
        }
    }
    
    // Rotate players array
    workingPlayers.splice(1, 0, workingPlayers.pop()!);
  }

  return matches;
};

// Advanced 2v2 Individual Logic with Balancing
const generate2v2Fixtures = (players: Player[], isDoubleRound: boolean): Match[] => {
  const matches: Match[] = [];
  
  // 1. Generate all unique partnerships (Teams)
  const pairs: string[][] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i].id, players[j].id]);
    }
  }

  // Shuffle pairs
  let shuffledPairs = shuffle(pairs);

  // 2. Create valid matchups
  const possibleMatchups: { pair1: string[], pair2: string[] }[] = [];
  
  for (let i = 0; i < shuffledPairs.length; i++) {
      for (let j = i + 1; j < shuffledPairs.length; j++) {
          const p1 = shuffledPairs[i];
          const p2 = shuffledPairs[j];
          const hasOverlap = p1.some(id => p2.includes(id));
          if (!hasOverlap) {
              possibleMatchups.push({ pair1: p1, pair2: p2 });
          }
      }
  }

  // 3. Greedy selection
  let matchQueue = shuffle([...possibleMatchups]);
  const finalMatchups: { pair1: string[], pair2: string[] }[] = [];
  const pairUsageCount: Record<string, number> = {}; 
  
  const getPairKey = (p: string[]) => [...p].sort().join('-');
  
  pairs.forEach(p => {
      pairUsageCount[getPairKey(p)] = 0;
  });

  const maxUsage = isDoubleRound ? 2 : 1;

  for (const m of matchQueue) {
      const k1 = getPairKey(m.pair1);
      const k2 = getPairKey(m.pair2);
      
      if (pairUsageCount[k1] < maxUsage && pairUsageCount[k2] < maxUsage) {
          finalMatchups.push(m);
          pairUsageCount[k1]++;
          pairUsageCount[k2]++;
      }
  }
  
  // 4. Order matches
  const orderedMatches: typeof finalMatchups = [];
  const remaining = [...finalMatchups];
  let lastMatchPlayers: string[] = [];
  
  while(remaining.length > 0) {
      let candidateIndex = -1;
      candidateIndex = remaining.findIndex(m => {
          const allPlayers = [...m.pair1, ...m.pair2];
          return !allPlayers.some(p => lastMatchPlayers.includes(p));
      });
      if (candidateIndex === -1) candidateIndex = 0;
      
      const selected = remaining[candidateIndex];
      orderedMatches.push(selected);
      lastMatchPlayers = [...selected.pair1, ...selected.pair2];
      remaining.splice(candidateIndex, 1);
  }

  // Convert to Match Objects
  orderedMatches.forEach((m, index) => {
      matches.push({
          id: generateId(),
          round: Math.floor(index / (players.length / 2)) + 1,
          home: { playerIds: m.pair1, score: null, footballTeam: '', isGhost: false },
          away: { playerIds: m.pair2, score: null, footballTeam: '', isGhost: false },
          isCompleted: false,
          timestamp: Date.now()
      });
  });

  // 5. BALANCING LOGIC (Ghost Matches)
  // Calculate how many games everyone plays
  const counts: Record<string, number> = {};
  players.forEach(p => counts[p.id] = 0);
  
  matches.forEach(m => {
      [...m.home.playerIds, ...m.away.playerIds].forEach(pid => {
          counts[pid] = (counts[pid] || 0) + 1;
      });
  });

  const maxPlayed = Math.max(...Object.values(counts));
  // Find players who played fewer games than max
  const underplayed = players.filter(p => counts[p.id] < maxPlayed);

  // Identify pairs already played to avoid repeating logic for Ghost team
  const playedPairs = new Set<string>();
  matches.forEach(m => {
      playedPairs.add(getPairKey(m.home.playerIds));
      playedPairs.add(getPairKey(m.away.playerIds));
  });

  // If we have at least 2 underplayed players, force pair them
  for (let i = 0; i < underplayed.length; i += 2) {
      if (i + 1 >= underplayed.length) break; // Need a pair
      
      const p1 = underplayed[i];
      const p2 = underplayed[i + 1];
      const team1Ids = [p1.id, p2.id]; // The team needing a match

      // Find opponents (Ghost Team)
      // Pick 2 players from the REST of the pool
      const potentialOpponents = players.filter(p => p.id !== p1.id && p.id !== p2.id);
      
      if (potentialOpponents.length >= 2) {
         // Try to find a pair that hasn't played together to add variety
         let bestOpponentPair: string[] | null = null;
         
         // Helper to get all pairs from pool
         const oppPairs: string[][] = [];
         for(let x=0; x<potentialOpponents.length; x++) {
             for(let y=x+1; y<potentialOpponents.length; y++) {
                 oppPairs.push([potentialOpponents[x].id, potentialOpponents[y].id]);
             }
         }
         
         // Shuffle to randomise
         const shuffledOppPairs = shuffle(oppPairs);

         // Find first one not played if possible
         bestOpponentPair = shuffledOppPairs.find(p => !playedPairs.has(getPairKey(p))) || shuffledOppPairs[0];

         if (bestOpponentPair) {
             const roundNum = matches.length > 0 ? matches[matches.length-1].round + 1 : 1;
             matches.push({
                id: generateId(),
                round: roundNum,
                home: { playerIds: team1Ids, score: null, footballTeam: '', isGhost: false },
                away: { playerIds: bestOpponentPair, score: null, footballTeam: '', isGhost: true }, // GHOST TEAM
                isCompleted: false,
                timestamp: Date.now()
            });
         }
      }
  }

  return matches;
};

export const calculateStandings = (players: Player[], matches: Match[], type: TournamentType): StandingsRow[] => {
  const stats: Record<string, StandingsRow> = {};

  // Init
  players.forEach(p => {
    stats[p.id] = {
      playerId: p.id,
      playerName: p.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    };
  });

  matches.forEach(match => {
    if (!match.isCompleted || match.home.score === null || match.away.score === null) return;

    const processSide = (side: MatchTeam, opponent: MatchTeam) => {
      if (side.isGhost) return; // SKIP STATS FOR GHOST TEAMS

      side.playerIds.forEach(pid => {
        if (!stats[pid]) return;
        const s = stats[pid];
        const gf = side.score!;
        const ga = opponent.score!;
        
        s.played += 1;
        s.goalsFor += gf;
        s.goalsAgainst += ga;
        s.goalDifference = s.goalsFor - s.goalsAgainst;

        if (gf > ga) {
          s.won += 1;
          s.points += 3;
        } else if (gf === ga) {
          s.drawn += 1;
          s.points += 1;
        } else {
          s.lost += 1;
        }
      });
    };

    processSide(match.home, match.away);
    processSide(match.away, match.home);
  });

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
};

export const calculateTeamStats = (matches: Match[]): TeamStat[] => {
  const teamStats: Record<string, TeamStat> = {};

  matches.forEach(match => {
    if (!match.isCompleted || match.home.score === null || match.away.score === null) return;

    const processTeam = (teamName: string, isGhost: boolean | undefined, isWinner: boolean, isDraw: boolean) => {
      if (isGhost) return; // Ignore ghost teams in team stats

      const cleanName = teamName.trim();
      if (!cleanName) return;

      if (!teamStats[cleanName]) {
        teamStats[cleanName] = {
          teamName: cleanName,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          winRate: 0
        };
      }
      
      const t = teamStats[cleanName];
      t.played += 1;
      if (isWinner) t.won += 1;
      else if (isDraw) t.drawn += 1;
      else t.lost += 1;

      t.winRate = Math.round((t.won / t.played) * 100);
    };

    const hScore = match.home.score;
    const aScore = match.away.score;

    processTeam(match.home.footballTeam, match.home.isGhost, hScore > aScore, hScore === aScore);
    processTeam(match.away.footballTeam, match.away.isGhost, aScore > hScore, hScore === aScore);
  });

  return Object.values(teamStats).sort((a, b) => b.won - a.won || b.winRate - a.winRate);
};