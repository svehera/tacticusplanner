import { assert } from 'console';
import { DamageType, Faction, Rank, Rarity, RarityStars, Trait } from 'src/models/enums';
import { StaticDataService } from 'src/services';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';

export interface DamageUnitData {
    damage: number;
    armor: number;
    health: number;
    meleeHits: number;
    meleeType: DamageType;
    rangeHits?: number;
    rangeType?: DamageType;
    gravis: boolean;
}

export class DamageCalculatorService {
    static getUnitData(id: string, faction: Faction, rank: Rank, rarity: Rarity, stars: RarityStars): DamageUnitData {
        const npc = StaticDataService.npcDataFull.find(npc => npc.name === id);
        if (npc != undefined) {
            return {
                damage: StatCalculatorService.calculateNpcDamage(npc.name, stars, rank),
                armor: StatCalculatorService.calculateNpcArmor(npc.name, stars, rank),
                health: StatCalculatorService.calculateNpcHealth(npc.name, stars, rank),
                meleeHits: npc.meleeHits,
                meleeType: this.convertDamageType(npc.meleeType)!,
                rangeHits: npc.rangeHits,
                rangeType: this.convertDamageType(npc.rangeType),
                gravis: npc.traits.includes('MK X Gravis'),
            };
        }
        const unit = StaticDataService.unitsData.find(unit => unit.id === id)!;
        return {
            damage: StatCalculatorService.calculateDamage(unit.id, rarity, stars, rank, 0),
            armor: StatCalculatorService.calculateArmor(unit.id, rarity, stars, rank, 0),
            health: StatCalculatorService.calculateHealth(unit.id, rarity, stars, rank, 0),
            meleeHits: unit.meleeHits,
            meleeType: unit.damageTypes.melee,
            rangeHits: unit.rangeHits,
            rangeType: unit.damageTypes.range,
            gravis: unit.traits.includes(Trait.MKXGravis),
        };
    }

    static runAttackSimulations(
        damage: number,
        hits: number,
        type: DamageType,
        defender: DamageUnitData,
        totalSims: number
    ): number[] {
        const ret: number[] = [];
        const minDamage = Math.max(
            1,
            hits * this.getDamageFrom1Hit(damage * 0.8, type, defender.armor, defender.gravis)
        );
        const maxDamage = Math.max(
            1,
            hits * this.getDamageFrom1Hit(damage * 1.2, type, defender.armor, defender.gravis)
        );
        ret.push(Math.min(minDamage, defender.health));
        ret.push(Math.min(maxDamage, defender.health));
        for (let i = 2; i < totalSims; ++i) {
            let totalDamage: number = 0;
            for (let j = 0; j < hits; ++j) {
                const rng = 1 + (Math.round(Math.random() * 41) - 20) / 100.0;
                totalDamage += Math.round(this.getDamageFrom1Hit(damage * rng, type, defender.armor, defender.gravis));
            }
            totalDamage = Math.min(totalDamage, defender.health);
            ret.push(totalDamage);
        }
        ret.sort((a, b) => b - a);
        return ret;
    }

    private static getPierce(type: DamageType): number {
        switch (type) {
            case DamageType.Bio:
                return 30;
            case DamageType.Blast:
                return 15;
            case DamageType.Bolter:
                return 20;
            case DamageType.Chain:
                return 20;
            case DamageType.Direct:
                return 100;
            case DamageType.Energy:
                return 30;
            case DamageType.Eviscerate:
                return 50;
            case DamageType.Flame:
                return 25;
            case DamageType.HeavyRound:
                return 55;
            case DamageType.Las:
                return 10;
            case DamageType.Melta:
                return 75;
            case DamageType.Molecular:
                return 60;
            case DamageType.Particle:
                return 35;
            case DamageType.Physical:
                return 1;
            case DamageType.Piercing:
                return 80;
            case DamageType.Plasma:
                return 65;
            case DamageType.Power:
                return 40;
            case DamageType.Projectile:
                return 15;
            case DamageType.Psychic:
                return 100;
            case DamageType.Pulse:
                return 20;
            case DamageType.Toxic:
                return 70;
        }
        return 1;
    }

    private static convertDamageType(type: string | undefined): DamageType | undefined {
        if (type == undefined) return undefined;
        return DamageType[type as keyof typeof DamageType];
    }

    private static getDamageFrom1Hit(damage: number, type: DamageType, armor: number, gravis: boolean): number {
        const damageWithPierce = (damage * this.getPierce(type)) / 100.0;
        const damageOverArmor = damage - armor;
        const totalDamage = Math.round(Math.max(damageWithPierce, damageOverArmor));
        if (gravis) return this.getDamageFrom1Hit(totalDamage, type, armor, false);
        return totalDamage;
    }
}
