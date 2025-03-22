import { Rank, Rarity, RarityStars } from 'src/models/enums';
import { ICharacter2, IRankUpData, IUnitData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';
import { rankToString } from 'src/shared-logic/functions';

export class StatCalculatorService {
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
        return StatCalculatorService.countStatUpgrades(unit, 0, 1);
    }

    /** @returns the number of relevant upgrades the unit has applied. */
    static countDamageUpgrades(unit: ICharacter2 | undefined): number {
        return StatCalculatorService.countStatUpgrades(unit, 2, 3);
    }

    /** @returns the number of relevant upgrades the unit has applied. */
    static countArmorUpgrades(unit: ICharacter2 | undefined): number {
        return StatCalculatorService.countStatUpgrades(unit, 4, 5);
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
        const characterUpgrades = StaticDataService.rankUpData[unit.id];
        let count: number = 0;
        if (unit.rank == Rank.Diamond3) return 0;
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
            unit!.id,
            unit!.rarity,
            unit!.stars,
            unit!.rank,
            StatCalculatorService.countHealthUpgrades(unit)
        );
    }

    /**
     * @returns the damage of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getDamage(unit: ICharacter2 | undefined): number {
        if (unit == null) return 0;
        return this.calculateDamage(
            unit!.id,
            unit!.rarity,
            unit!.stars,
            unit!.rank,
            StatCalculatorService.countDamageUpgrades(unit)
        );
    }

    /**
     * @returns the armor of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getArmor(unit: ICharacter2 | undefined): number {
        if (unit == null) return 0;
        return this.calculateArmor(
            unit!.id,
            unit!.rarity,
            unit!.stars,
            unit!.rank,
            StatCalculatorService.countArmorUpgrades(unit)
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
    private static calculateStat(
        baseStat: number,
        unitId: string,
        rarityStars: RarityStars,
        rank: Rank,
        numAppliedUpgrades: number
    ): number {
        const rankValue: number = StatCalculatorService.getRankForComputation(rank);
        const rarityValue: number = rarityStars as number;
        // According to Towen, SP buffed Incisus at some point, and he's now
        // literally the only character that has a special calculation for his
        // stats.
        const incisusHack: number = unitId === 'Incisus' ? 1 : 0;
        const upgradeBoost =
            (baseStat * Math.pow(1.25205, rankValue + 1) - baseStat * Math.pow(1.25205, rankValue)) / 2.0;
        return Math.round(
            upgradeBoost * numAppliedUpgrades +
                baseStat *
                    Math.pow(1.25205, rankValue) *
                    (1 + 0.1 * rarityValue) *
                    (1 + Math.min(0.05 * rankValue, 0.3) * incisusHack)
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
        const unit = StaticDataService.unitsData.find(u => u.id === unitId);
        return StatCalculatorService.calculateStat(unit?.health ?? -1, unitId, rarityStars, rank, numAppliedUpgrades);
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
        const unit = StaticDataService.unitsData.find(u => u.id === unitId);
        return StatCalculatorService.calculateStat(unit?.damage ?? -1, unitId, rarityStars, rank, numAppliedUpgrades);
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
        const unit = StaticDataService.unitsData.find(u => u.id === unitId);
        return StatCalculatorService.calculateStat(unit?.armour ?? -1, unitId, rarityStars, rank, numAppliedUpgrades);
    }
}
