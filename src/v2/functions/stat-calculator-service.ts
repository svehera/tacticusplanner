import { Rank, Rarity, RarityStars } from 'src/models/enums';
import { ICharacter2, IUnitData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';

export class StatCalculatorService {
    /**
     * @returns the integral value used in stat computations for the given number
     * of stars, or -1 if `stars` is invalid.
     */
    private static getRarityForComputation(stars: RarityStars): number {
        switch (stars) {
            case RarityStars.None:
                return 0;
            case RarityStars.OneStar:
                return 1;
            case RarityStars.TwoStars:
                return 2;
            case RarityStars.ThreeStars:
                return 3;
            case RarityStars.FourStars:
                return 4;
            case RarityStars.FiveStars:
                return 5;
            case RarityStars.RedOneStar:
                return 6;
            case RarityStars.RedTwoStars:
                return 7;
            case RarityStars.RedThreeStars:
                return 8;
            case RarityStars.RedFourStars:
                return 9;
            case RarityStars.RedFiveStars:
                return 10;
            case RarityStars.BlueStar:
                return 11;
        }
        return -1;
    }

    /**
     * @returns the integral value used in stat computations for the given rank.
     *          -1 if `rank` is invalid or `Locked` (for locked characters,
     *          please pass their unlock rarity).
     */
    private static getRankForComputation(rank: Rank): number {
        switch (rank) {
            case Rank.Locked:
                return -1;
            case Rank.Stone1:
                return 0;
            case Rank.Stone2:
                return 1;
            case Rank.Stone3:
                return 2;
            case Rank.Iron1:
                return 3;
            case Rank.Iron2:
                return 4;
            case Rank.Iron3:
                return 5;
            case Rank.Bronze1:
                return 6;
            case Rank.Bronze2:
                return 7;
            case Rank.Bronze3:
                return 8;
            case Rank.Silver1:
                return 9;
            case Rank.Silver2:
                return 10;
            case Rank.Silver3:
                return 11;
            case Rank.Gold1:
                return 12;
            case Rank.Gold2:
                return 13;
            case Rank.Gold3:
                return 14;
            case Rank.Diamond1:
                return 15;
            case Rank.Diamond2:
                return 16;
            case Rank.Diamond3:
                return 17;
        }
    }

    /**
     * @returns the health of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getHealth(unit: ICharacter2): number {
        return this.calculateHealth(unit.id, unit.rarity, unit.rarityStars, unit.rank);
    }

    /**
     * @returns the damage of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getDamage(unit: ICharacter2): number {
        return this.calculateDamage(unit.id, unit.rarity, unit.rarityStars, unit.rank);
    }

    /**
     * @returns the armor of the given unit, given their current rarity, rank,
     *          and equipment. -1 if the unit can't be found.
     */
    static getArmor(unit: ICharacter2): number {
        return this.calculateArmor(unit.id, unit.rarity, unit.rarityStars, unit.rank);
    }

    private static calculateStat(baseStat: number, unitId: string, rarityStars: RarityStars, rank: Rank): number {
        const rankValue: number = this.getRankForComputation(rank);
        const rarityValue: number = this.getRarityForComputation(rarityStars);
        const incisusHack: number = unitId == 'Incisus' ? 1 : 0;
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
        const units: IUnitData[] = StaticDataService.unitsData.filter(u => u.id === unitId);
        return units.length != 1 ? -1 : this.calculateStat(units[0].health, unitId, rarityStars, rank);
    }

    /**
     * @returns the calculated damage for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateDamage(unitId: string, rarity: Rarity, rarityStars: RarityStars, rank: Rank): number {
        const units: IUnitData[] = StaticDataService.unitsData.filter(u => u.id === unitId);
        return units.length != 1 ? -1 : this.calculateStat(units[0].damage, unitId, rarityStars, rank);
    }

    /**
     * @returns the calculated armor for the given unit at the given rarity
     *          and rank. -1 if the unit can't be found.
     */
    static calculateArmor(unitId: string, rarity: Rarity, rarityStars: RarityStars, rank: Rank): number {
        const units: IUnitData[] = StaticDataService.unitsData.filter(u => u.id === unitId);
        return units.length != 1 ? -1 : this.calculateStat(units[0].armour, unitId, rarityStars, rank);
    }
}
