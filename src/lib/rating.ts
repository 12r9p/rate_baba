import { Player } from '@/types/game';

/**
 * Calculate the rate change for a player based on their performance.
 * 
 * Rules:
 * - Initial Rate: 100 (handled at player creation)
 * - 1st Game (or if no prev rank known, though usually valid after 1st game):
 *   1st: +4, 2nd: +3, 3rd: +2, 4th: +1, 5th: 0, 6th: 0
 * - 2nd+ Game:
 *   Base = (PrevRank - CurrentRank) * 8
 *   Same Rank Bonus = +10 (if PrevRank == CurrentRank)
 *   High Rate Correction (>= 130): Gains * 0.8
 *   Low Rate Correction (<= 70): Gains * 1.2
 *   Min Rate: 30
 */
export function calculateRateChange(
  currentRate: number,
  rank: number,
  prevRank: number | null,
  isFirstGame: boolean
): number {
  let change = 0;

  if (isFirstGame || prevRank === null) {
    // 1st Game Fixed Points (Scaled for 1000 base)
    // 1st->40, 2nd->30, 3rd->20, 4th->10, 5th->0, 6th->0
    const points = [40, 30, 20, 10, 0, 0];
    change = points[rank - 1] || 0;
  } else {
    // 2nd+ Game
    change = (prevRank - rank) * 80; // Scaled 8 -> 80

    // Bonus for maintaining rank
    if (prevRank === rank) {
      change += 100; // Scaled 10 -> 100
    }
  }

  // Apply Corrections
  // High rate correction: gains * 0.8 -> harder to climb.
  // Low rate correction: gains * 1.2 -> easier to recover
  
  if (change > 0) {
    if (currentRate >= 1300) {
      change = Math.floor(change * 0.8);
    }
    if (currentRate <= 700) {
      change = Math.floor(change * 1.2);
    }
  }

  return change;
}

export function applyRateChange(player: Player, change: number): Player {
  let newRate = player.rate + change;
  if (newRate < 30) newRate = 30; // Lower bound

  return {
    ...player,
    rate: newRate,
    rateHistory: [...player.rateHistory, newRate],
  };
}
