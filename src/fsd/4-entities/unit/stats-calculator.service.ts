import { RarityStars, Rarity, Rank, rankToString } from '@/fsd/5-shared/model';

import { ICharacter2, CharactersService, rankUpData } from '@/fsd/4-entities/character/@x/unit';
import { NpcService } from '@/fsd/4-entities/npc/@x/unit';

export class StatsCalculatorService {
    // The following NPC ability levels were gathered by Towen. They map to
    // ranks Stone 1 ... Diamond 3. Gathered by Towen.
    private readonly npcAbilityLevel = [
        1, // Stone 1
        3,
        5,
        8, // Iron 1
        11,
        14,
        17, // Bronze 1
        20,
        23,
        26, // Silver 1
        29,
        32,
        35, // Gold 1
        38,
        41,
        44, // Diamond 1
        47,
        50,
    ];

    // This represents the power curve of an ability, which works for all but
    // a very select few. Again, very graciously gathered by Towen.
    private readonly abilityPowerCurve = [
        1, 1.2, 1.4, 1.6, 1.82, 2.04, 2.27, 2.5, 2.73, 2.96, 3.19, 3.42, 3.65, 3.88, 4.1, 4.33, 4.56, 4.79, 5.02, 5.25,
        5.55, 6.0, 6.91, 7.82, 8.72, 9.63, 10.54, 11.45, 12.36, 13.27, 14.18, 15.09, 16.0, 16.9, 17.81, 18.72, 19.63,
        20.54, 21.45, 22.75, 24.55, 26.45, 28.45, 30.74, 34.85, 38.95, 43.06, 47.17, 51.28, 55.39,
    ];
    /**
     * @returns the integral value used in stat computations for the given rank.
     *          -1 if `rank` is invalid or `Locked` (for locked characters,
     *          please pass their unlock rarity).
     */
    private static getRankForComputation(rank: Rank): number {
        if (rank == Rank.Locked) return 0;
        return (rank as number) - 1;
    }

    /** @returns the number of relevant upgrades the unit has applied. */
    static countHealthUpgrades(unit: ICharacter2 | undefined): number {
        return StatsCalculatorService.countStatUpgrades(unit, 0, 1);
    }

    /** @returns the number of relevant upgrades the unit has applied. */
    static countDamageUpgrades(unit: ICharacter2 | undefined): number {
        return StatsCalculatorService.countStatUpgrades(unit, 2, 3);
    }

    /** @returns the number of relevant upgrades the unit has applied. */
    static countArmorUpgrades(unit: ICharacter2 | undefined): number {
        return StatsCalculatorService.countStatUpgrades(unit, 4, 5);
    }

    /**
     * @param firstUpgradeIndex The index in the rank up data of the first stat upgrade.
     * @param secondUpgradeIndex The index in the rank up data of the second stat upgrade.
     * @returns How many relevant upgrades the unit has applied.
     */
    private static countStatUpgrades(
        unit: ICharacter2 | undefined,
        firstUpgradeIndex: number,
        secondUpgradeIndex: number
    ): number {
        if (unit == undefined) return 0;
        const characterUpgrades = rankUpData[unit.id];
        let count: number = 0;
        if (unit.rank == Rank.Diamond3 || typeof characterUpgrades === 'undefined') return 0;
        const upgrades = characterUpgrades[rankToString(unit.rank)];
        if (unit.upgrades.findIndex(u => u === upgrades[firstUpgradeIndex]) != -1) ++count;
        if (unit.upgrades.findIndex(u => u === upgrades[secondUpgradeIndex]) != -1) ++count;
        return count;
    }

    /**
     * @returns the health of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getHealth(unit: ICharacter2 | undefined): number {
        if (unit == null) return 0;
        return this.calculateHealth(
            unit!.snowprintId!,
            unit!.rarity,
            unit!.stars,
            unit!.rank,
            StatsCalculatorService.countHealthUpgrades(unit)
        );
    }

    /**
     * @returns the damage of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getDamage(unit: ICharacter2 | undefined): number {
        if (unit == null) return 0;
        return this.calculateDamage(
            unit!.snowprintId!,
            unit!.rarity,
            unit!.stars,
            unit!.rank,
            StatsCalculatorService.countDamageUpgrades(unit)
        );
    }

    /**
     * @returns the armor of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getArmor(unit: ICharacter2 | undefined): number {
        if (unit == null) return 0;
        return this.calculateArmor(
            unit!.snowprintId!,
            unit!.rarity,
            unit!.stars,
            unit!.rank,
            StatsCalculatorService.countArmorUpgrades(unit)
        );
    }

    /**
     * @param baseStat the value of the stat at common, no-stars, stone 1.
     * @param unitId the ID of the unit.
     * @param rarityStars the rarity of the unit at which to calculate the stat.
     * @param rank the rank of the unit at which to calculate the stat.
     * @param numAppliedUpgrades the number of applied upgrades related to this stat the unit has.
     * @returns The computed value of the stat.
     */
    public static calculateStat(
        baseStat: number,
        unitId: string,
        rarityStars: RarityStars,
        rank: Rank,
        numAppliedUpgrades: number
    ): number {
        const rankValue: number = StatsCalculatorService.getRankForComputation(rank);
        const rarityValue: number = rarityStars as number;
        const upgradeBoost =
            (baseStat * Math.pow(1.25205, rankValue + 1) - baseStat * Math.pow(1.25205, rankValue)) / 2.0;
        return Math.round(
            upgradeBoost * numAppliedUpgrades + baseStat * Math.pow(1.25205, rankValue) * (1 + 0.1 * rarityValue)
        );
    }

    /**
     * @returns the calculated health for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateHealth(
        unitId: string,
        rarity: Rarity,
        rarityStars: RarityStars,
        rank: Rank,
        numAppliedUpgrades: number
    ): number {
        const unit = CharactersService.charactersData.find(u => u.snowprintId === unitId);
        return StatsCalculatorService.calculateStat(unit?.health ?? -1, unitId, rarityStars, rank, numAppliedUpgrades);
    }

    /**
     * @returns the calculated damage for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateDamage(
        unitId: string,
        rarity: Rarity,
        rarityStars: RarityStars,
        rank: Rank,
        numAppliedUpgrades: number
    ): number {
        const unit = CharactersService.charactersData.find(u => u.snowprintId === unitId);
        return StatsCalculatorService.calculateStat(unit?.damage ?? -1, unitId, rarityStars, rank, numAppliedUpgrades);
    }

    /**
     * @returns the calculated armor for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateArmor(
        unitId: string,
        rarity: Rarity,
        rarityStars: RarityStars,
        rank: Rank,
        numAppliedUpgrades: number
    ): number {
        const unit = CharactersService.charactersData.find(u => u.snowprintId === unitId);
        return StatsCalculatorService.calculateStat(unit?.armour ?? -1, unitId, rarityStars, rank, numAppliedUpgrades);
    }

    /**
     * @returns the calculated armor for the given NPC. -1 if the unit can't be found.
     */
    static calculateNpcArmor(npc: string, stars: RarityStars, rank: Rank): number {
        const unit = NpcService.npcDataFull.find(u => u.name === npc);
        if (unit == undefined) return -1;
        return StatsCalculatorService.calculateStat(unit.armor, npc, stars, rank, 0);
    }

    /**
     * @returns the calculated armor for the given NPC. -1 if the unit can't be found.
     */
    static calculateNpcDamage(npc: string, stars: RarityStars, rank: Rank): number {
        const unit = NpcService.npcDataFull.find(u => u.name === npc);
        if (unit == undefined) return -1;
        return StatsCalculatorService.calculateStat(unit.damage, npc, stars, rank, 0);
    }

    /**
     * @returns the calculated armor for the given NPC. -1 if the unit can't be found.
     */
    static calculateNpcHealth(npc: string, stars: RarityStars, rank: Rank): number {
        const unit = NpcService.npcDataFull.find(u => u.name == npc);
        if (unit == undefined) return -1;
        return StatsCalculatorService.calculateStat(unit.health, npc, stars, rank, 0);
    }
}
