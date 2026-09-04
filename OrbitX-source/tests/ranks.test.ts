import { describe, it, expect } from "vitest";
import { RANK_TIERS, getAstronautRank, RANK_BADGES } from "../src/shared";

describe("RANK_TIERS", () => {
  it("has exactly 9 ranks", () => {
    expect(RANK_TIERS.length).toBe(9);
  });

  it("is sorted by minXp ascending and starts at 0", () => {
    expect(RANK_TIERS[0].minXp).toBe(0);
    for (let i = 1; i < RANK_TIERS.length; i++) {
      expect(RANK_TIERS[i].minXp).toBeGreaterThan(RANK_TIERS[i - 1].minXp);
    }
  });

  it("rank emblems share the exact XP thresholds and icons (level system tied to badges)", () => {
    const rankXp = RANK_TIERS.map((r) => r.minXp);
    const rankIcons = RANK_TIERS.map((r) => r.icon);
    const badgeXp = RANK_BADGES.map((b) => b.minXp);
    const badgeIcons = RANK_BADGES.map((b) => b.emoji);
    expect(rankXp).toEqual(badgeXp);
    expect(rankIcons).toEqual(badgeIcons);
    expect(RANK_BADGES.length).toBe(9);
  });

  it("getAstronautRank picks the correct tier and progress", () => {
    const rank = getAstronautRank(5000);
    expect(rank.minXp).toBe(5000);
    expect(rank.nextRankMinXp).toBe(10000);
    expect(rank.progressPercentage).toBe(0); // 0/5000 into the 5000→10000 step

    const midway = getAstronautRank(7500);
    expect(midway.progressPercentage).toBe(50);

    const maxed = getAstronautRank(100000);
    expect(maxed.minXp).toBe(50000);
    expect(maxed.nextRankTitle).toBe("أقصى رتبة");
    expect(maxed.progressPercentage).toBe(100);
  });
});
