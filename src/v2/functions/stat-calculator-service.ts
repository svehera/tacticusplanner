import { Rank, Rarity, RarityStars } from 'src/models/enums';
import { ICharacter2, IUnitData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';

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

    /**
     * @returns the health of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getHealth(unit: ICharacter2 | null): number {
        if (unit == null) return 0;
        return this.calculateHealth(unit!.id, unit!.rarity, unit!.stars, unit!.rank);
    }

    /**
     * @returns the damage of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getDamage(unit: ICharacter2 | null): number {
        if (unit == null) return 0;
        return this.calculateDamage(unit!.id, unit!.rarity, unit!.stars, unit!.rank);
    }

    /**
     * @returns the armor of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getArmor(unit: ICharacter2 | null): number {
        if (unit == null) return 0;
        return this.calculateArmor(unit!.id, unit!.rarity, unit!.stars, unit!.rank);
    }

    private static calculateStat(baseStat: number, unitId: string, rarityStars: RarityStars, rank: Rank): number {
        const rankValue: number = StatCalculatorService.getRankForComputation(rank);
        const rarityValue: number = rarityStars as number;
        // According to Towen, SP buffed Incisus at some point, and he's now
        // literally the only character that has a special calculation for his
        // stats.
        const incisusHack: number = unitId === 'Incisus' ? 1 : 0;
        return Math.round(
            baseStat *
                Math.pow(1.25205, rankValue) *
                (1 + 0.1 * rarityValue) *
                (1 + Math.min(0.05 * rankValue, 0.3) * incisusHack),
            0
        );
    }

    /**
     * @returns the calculated health for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateHealth(unitId: string, rarity: Rarity, rarityStars: RarityStars, rank: Rank): number {
        const unit = StaticDataService.unitsData.find(u => u.id === unitId);
        return StatCalculatorService.calculateStat(unit?.health ?? -1, unitId, rarityStars, rank);
    }

    /**
     * @returns the calculated damage for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateDamage(unitId: string, rarity: Rarity, rarityStars: RarityStars, rank: Rank): number {
        const unit = StaticDataService.unitsData.find(u => u.id === unitId);
        return StatCalculatorService.calculateStat(unit?.damage ?? -1, unitId, rarityStars, rank);
    }

    /**
     * @returns the calculated armor for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateArmor(unitId: string, rarity: Rarity, rarityStars: RarityStars, rank: Rank): number {
        const unit = StaticDataService.unitsData.find(u => u.id === unitId);
        return StatCalculatorService.calculateStat(unit?.armour ?? -1, unitId, rarityStars, rank);
    }
}
