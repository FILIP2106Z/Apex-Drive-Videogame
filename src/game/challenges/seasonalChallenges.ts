/**
 * Seasonal Challenges & Social Leaderboard system
 */

import { SeasonalChallenge, LeaderboardEntry } from '../../types/game';

export const SEASONAL_CHALLENGES: SeasonalChallenge[] = [
  {
    id: 'highway_speed_trap',
    title: 'Interstate 99 Radar Blitz',
    type: 'speed_trap',
    description: 'Trigger the speed radar on the eastern highway straightaway at maximum velocity.',
    targetObjective: 'Target: > 280 km/h (174 mph)',
    rewardCredits: 15000,
    locationDescription: 'Highway Eastern Straightaway [X: 280, Z: 60]',
    bestScore: 0,
    targetBronze: 220,
    targetSilver: 260,
    targetGold: 310,
    active: true,
  },
  {
    id: 'mountain_drift_zone',
    title: 'Fujimi Mountain Hairpins',
    type: 'drift_zone',
    description: 'Chain continuous high-angle drifts across the winding mountain elevation pass.',
    targetObjective: 'Target: > 8,000 Drift Points',
    rewardCredits: 22000,
    locationDescription: 'Mountain Ascent Hairpins [X: -240, Z: -180]',
    bestScore: 0,
    targetBronze: 3500,
    targetSilver: 6500,
    targetGold: 10000,
    active: true,
  },
  {
    id: 'airport_mega_jump',
    title: 'Apex Flight Deck Mega Launch',
    type: 'stunt_jump',
    description: 'Hit the airport runway stunt ramp at full throttle and achieve maximum airborne distance.',
    targetObjective: 'Target: > 140 meters air distance',
    rewardCredits: 18000,
    locationDescription: 'Airport Runway Stunt Ramp [X: 350, Z: -220]',
    bestScore: 0,
    targetBronze: 80,
    targetSilver: 120,
    targetGold: 160,
    active: true,
  },
  {
    id: 'city_checkpoint_trial',
    title: 'Neon Downtown Time Attack',
    type: 'time_trial',
    description: 'Race through 8 neon gates weaving through skyscrapers and port docks under the clock.',
    targetObjective: 'Target: Under 55.0 seconds',
    rewardCredits: 30000,
    locationDescription: 'Downtown Financial Plaza [X: 0, Z: 0]',
    bestScore: 0,
    targetBronze: 75,
    targetSilver: 62,
    targetGold: 50,
    active: true,
  },
];

export const INITIAL_RIVAL_LEADERBOARDS: Record<string, LeaderboardEntry[]> = {
  highway_speed_trap: [
    { id: 'r1', rank: 1, playerName: 'Klaus_V10', vehicle: 'Venom V10', score: 352, displayValue: '352 km/h', date: 'Season 4' },
    { id: 'r2', rank: 2, playerName: 'TurboTatsuro', vehicle: 'Apex GT-R', score: 338, displayValue: '338 km/h', date: 'Season 4' },
    { id: 'r3', rank: 3, playerName: 'CyberGhost', vehicle: 'Phantom EV', score: 326, displayValue: '326 km/h', date: 'Season 4' },
    { id: 'r4', rank: 4, playerName: 'MuscleDan', vehicle: 'Viper V8', score: 298, displayValue: '298 km/h', date: 'Season 4' },
    { id: 'r5', rank: 5, playerName: 'RallyQueen', vehicle: 'Brawler 4x4', score: 224, displayValue: '224 km/h', date: 'Season 4' },
  ],
  mountain_drift_zone: [
    { id: 'd1', rank: 1, playerName: 'Dorikin86', vehicle: 'Apex GT-R', score: 14250, displayValue: '14,250 pts', date: 'Season 4' },
    { id: 'd2', rank: 2, playerName: 'SlideMaster', vehicle: 'Viper V8', score: 12100, displayValue: '12,100 pts', date: 'Season 4' },
    { id: 'd3', rank: 3, playerName: 'AkinaNight', vehicle: 'Apex GT-R', score: 9800, displayValue: '9,800 pts', date: 'Season 4' },
    { id: 'd4', rank: 4, playerName: 'VenomX', vehicle: 'Venom V10', score: 7950, displayValue: '7,950 pts', date: 'Season 4' },
    { id: 'd5', rank: 5, playerName: 'DesertFox', vehicle: 'Brawler 4x4', score: 4800, displayValue: '4,800 pts', date: 'Season 4' },
  ],
  airport_mega_jump: [
    { id: 'j1', rank: 1, playerName: 'AirborneAce', vehicle: 'Venom V10', score: 178, displayValue: '178.4 m', date: 'Season 4' },
    { id: 'j2', rank: 2, playerName: 'NitroJunkie', vehicle: 'Phantom EV', score: 165, displayValue: '165.2 m', date: 'Season 4' },
    { id: 'j3', rank: 3, playerName: 'TrophyTrucker', vehicle: 'Brawler 4x4', score: 149, displayValue: '149.0 m', date: 'Season 4' },
    { id: 'j4', rank: 4, playerName: 'RedlineDan', vehicle: 'Apex GT-R', score: 132, displayValue: '132.8 m', date: 'Season 4' },
  ],
  city_checkpoint_trial: [
    { id: 't1', rank: 1, playerName: 'ApexPilot', vehicle: 'Venom V10', score: 47.2, displayValue: '47.20 s', date: 'Season 4' },
    { id: 't2', rank: 2, playerName: 'MidnightRunner', vehicle: 'Phantom EV', score: 50.8, displayValue: '50.80 s', date: 'Season 4' },
    { id: 't3', rank: 3, playerName: 'GTR_Kenji', vehicle: 'Apex GT-R', score: 53.4, displayValue: '53.40 s', date: 'Season 4' },
    { id: 't4', rank: 4, playerName: 'V8Thunder', vehicle: 'Viper V8', score: 58.1, displayValue: '58.10 s', date: 'Season 4' },
  ],
};

/**
 * Inserts or updates the player's score into the seasonal leaderboard
 */
export function registerLeaderboardScore(
  challengeId: string,
  playerName: string,
  vehicleName: string,
  newScore: number,
  isLowerBetter = false
): LeaderboardEntry[] {
  const currentList = INITIAL_RIVAL_LEADERBOARDS[challengeId] || [];
  const existingPlayerIndex = currentList.findIndex((e) => e.isPlayer);

  let formattedValue = '';
  if (challengeId === 'city_checkpoint_trial') {
    formattedValue = newScore.toFixed(2) + ' s';
  } else if (challengeId === 'mountain_drift_zone') {
    formattedValue = Math.round(newScore).toLocaleString() + ' pts';
  } else if (challengeId === 'airport_mega_jump') {
    formattedValue = newScore.toFixed(1) + ' m';
  } else {
    formattedValue = Math.round(newScore) + ' km/h';
  }

  const playerEntry: LeaderboardEntry = {
    id: 'player_entry',
    rank: 1,
    playerName: playerName || 'Player (You)',
    vehicle: vehicleName,
    score: newScore,
    displayValue: formattedValue,
    date: 'Today',
    isPlayer: true,
  };

  const listWithoutPlayer = currentList.filter((e) => !e.isPlayer);
  listWithoutPlayer.push(playerEntry);

  // Sort
  listWithoutPlayer.sort((a, b) => (isLowerBetter ? a.score - b.score : b.score - a.score));

  // Re-rank
  return listWithoutPlayer.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}
