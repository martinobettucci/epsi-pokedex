// utils/gameHelpers.ts

import { Minimon, MinimonRarity, MinimonStatus } from '../types';

export const balanceConfig = {
  generationCost: 10,
  topOwnedCount: 8,
  overflowWeight: 0.25,
  resellRefunds: {
    [MinimonRarity.F]: 1,
    [MinimonRarity.E]: 2,
    [MinimonRarity.D]: 3,
    [MinimonRarity.C]: 4,
    [MinimonRarity.B]: 6,
    [MinimonRarity.A]: 10,
    [MinimonRarity.S]: 15,
    [MinimonRarity.S_PLUS]: 25,
  } as Record<MinimonRarity, number>,
  ownedScore: {
    [MinimonRarity.F]: 1,
    [MinimonRarity.E]: 2,
    [MinimonRarity.D]: 4,
    [MinimonRarity.C]: 7,
    [MinimonRarity.B]: 12,
    [MinimonRarity.A]: 20,
    [MinimonRarity.S]: 35,
    [MinimonRarity.S_PLUS]: 55,
  } as Record<MinimonRarity, number>,
  resoldScore: {
    [MinimonRarity.F]: 0,
    [MinimonRarity.E]: 0,
    [MinimonRarity.D]: 0.5,
    [MinimonRarity.C]: 1,
    [MinimonRarity.B]: 1.5,
    [MinimonRarity.A]: 2,
    [MinimonRarity.S]: 3,
    [MinimonRarity.S_PLUS]: 4,
  } as Record<MinimonRarity, number>,
};

export const getRarityResellValue = (rarity: MinimonRarity): number =>
  balanceConfig.resellRefunds[rarity] ?? 1;

export const getRarityMinidekScoreValue = (rarity: MinimonRarity): number =>
  balanceConfig.ownedScore[rarity] ?? 1;

export const getResoldMinidekScoreValue = (rarity: MinimonRarity): number =>
  balanceConfig.resoldScore[rarity] ?? 0;

export const tokensToScore = (tokens: number): number => {
  const t = Math.max(0, tokens);
  return Math.round(0.5 * t + 2.5 * Math.sqrt(t));
};

const setBonusThresholds = [
  { count: 8, bonus: 20 },
  { count: 5, bonus: 10 },
  { count: 3, bonus: 5 },
];

export const calculateDeckScore = (
  minimons: Minimon[],
  tokenBalance: number,
  quickFlipBonus = 0,
): number => {
  const owned = minimons
    .filter((minimon) => minimon.status === MinimonStatus.OWNED)
    .sort((a, b) => rarityOrderMap[b.rarity] - rarityOrderMap[a.rarity]);

  const topSlice = owned.slice(0, balanceConfig.topOwnedCount);
  const overflowSlice = owned.slice(balanceConfig.topOwnedCount);

  const topScore = topSlice.reduce((acc, minimon) => acc + getRarityMinidekScoreValue(minimon.rarity), 0);
  const overflowScore = overflowSlice.reduce(
    (acc, minimon) => acc + getRarityMinidekScoreValue(minimon.rarity) * balanceConfig.overflowWeight,
    0,
  );

  const resoldScore = minimons
    .filter((minimon) => minimon.status === MinimonStatus.RESOLD)
    .reduce((acc, minimon) => acc + getResoldMinidekScoreValue(minimon.rarity), 0);

  const distinctHighRarities = new Set(
    owned
      .filter((m) => [MinimonRarity.B, MinimonRarity.A, MinimonRarity.S, MinimonRarity.S_PLUS].includes(m.rarity))
      .map((m) => m.rarity),
  ).size;
  const setBonus = setBonusThresholds.reduce((bonus, threshold) => {
    if (distinctHighRarities >= threshold.count) {
      return Math.max(bonus, threshold.bonus);
    }
    return bonus;
  }, 0);

  return Math.round(topScore + overflowScore + resoldScore + tokensToScore(tokenBalance) + quickFlipBonus);
};

export const tokenToScoreSoftCap = (tokens: number): number => tokensToScore(tokens);

/**
 * A map defining the order of Minimon rarities for sorting purposes.
 * Higher numbers indicate higher rarity.
 */
export const rarityOrderMap: Record<MinimonRarity, number> = {
  [MinimonRarity.F]: 0,
  [MinimonRarity.E]: 1,
  [MinimonRarity.D]: 2,
  [MinimonRarity.C]: 3,
  [MinimonRarity.B]: 4,
  [MinimonRarity.A]: 5,
  [MinimonRarity.S]: 6,
  [MinimonRarity.S_PLUS]: 7,
};

/**
 * Checks if a given string is a valid MinimonRarity enum member.
 * @param rarityString The string to validate.
 * @returns True if the string is a valid MinimonRarity, false otherwise.
 */
export const isValidMinimonRarity = (rarityString: string): rarityString is MinimonRarity => {
  return Object.values(MinimonRarity).includes(rarityString as MinimonRarity);
};
