// utils/gameHelpers.ts

import { MinimonRarity } from '../types';

/**
 * Returns the resell value for a given Minimon rarity.
 * @param rarity The rarity of the Minimon.
 * @returns The number of tokens received when reselling.
 */
export const getRarityResellValue = (rarity: MinimonRarity): number => {
  switch (rarity) {
    case MinimonRarity.S_PLUS: return 25;
    case MinimonRarity.S: return 15;
    case MinimonRarity.A: return 10;
    case MinimonRarity.B: return 5;
    case MinimonRarity.C: return 4;
    case MinimonRarity.D: return 3;
    case MinimonRarity.E: return 2;
    case MinimonRarity.F: return 1;
    default: return 1;
  }
};

/**
 * Returns the Minidek score value for an OWNED Minimon based on its rarity.
 * Resold Minimon always give 1 point.
 * @param rarity The rarity of the Minimon.
 * @returns The number of points added to the Minidek score.
 */
export const getRarityMinidekScoreValue = (rarity: MinimonRarity): number => {
  switch (rarity) {
    case MinimonRarity.S_PLUS: return 80;
    case MinimonRarity.S: return 50;
    case MinimonRarity.A: return 30;
    case MinimonRarity.B: return 20;
    case MinimonRarity.C: return 15;
    case MinimonRarity.D: return 10;
    case MinimonRarity.E: return 7;
    case MinimonRarity.F: return 5;
    default: return 5;
  }
};

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