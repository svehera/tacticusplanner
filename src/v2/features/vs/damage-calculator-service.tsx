import { DamageType, Faction, Rank, Rarity, RarityStars, Trait } from 'src/models/enums';
import { StaticDataService } from 'src/services';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';
import { IEquipmentSpec } from './versus-interfaces';
import { EquipmentType } from 'src/models/interfaces';

export interface DamageUnitData {
    damage: number;
    armor: number;
    health: number;
    critDamage?: number;
    critChance?: number;
    blockDamage?: number;
    blockChance?: number;
    meleeHits: number;
    meleeType: DamageType;
    rangeHits?: number;
    rangeType?: DamageType;
    gravis: boolean;
}

/**
 * Exports several handy functions for calculating damage of one unit against
 * another. Typical use is to call runAttackSimulations and graph the result.
 */
export class DamageCalculatorService {
    static getUnitData(
        id: string,
        faction: Faction,
        rank: Rank,
        rarity: Rarity,
        stars: RarityStars,
        equipment: IEquipmentSpec[]
    ): DamageUnitData {
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
        let unitData: DamageUnitData = {
            damage: StatCalculatorService.calculateDamage(unit.id, rarity, stars, rank, 0),
            armor: StatCalculatorService.calculateArmor(unit.id, rarity, stars, rank, 0),
            health: StatCalculatorService.calculateHealth(unit.id, rarity, stars, rank, 0),
            meleeHits: unit.meleeHits,
            meleeType: unit.damageTypes.melee,
            rangeHits: unit.rangeHits,
            rangeType: unit.damageTypes.range,
            gravis: unit.traits.includes(Trait.MKXGravis),
        };
        equipment.forEach(equip => (unitData = this.adjustUnitData(unitData, equip)));
        return unitData;
    }

    static adjustUnitData(unitData: DamageUnitData, equipment: IEquipmentSpec): DamageUnitData {
        if (equipment.equipment == undefined) return unitData;
        if (equipment.type == EquipmentType.Block || equipment.type == EquipmentType.BlockBooster) {
            if (unitData.blockChance == undefined) unitData.blockChance = 0;
            if (unitData.blockDamage == undefined) unitData.blockDamage = 0;
            unitData.blockChance += equipment.equipment.chance!;
            unitData.blockDamage += equipment.equipment.boost1[equipment.level! - 1];
        } else if (equipment.type == EquipmentType.Crit || equipment.type == EquipmentType.CritBooster) {
            // Crit items always come in order. First crit, then maybe second crit, then maybe crit booster.
            if (unitData.critChance == undefined) unitData.critChance = 0;
            if (unitData.critDamage == undefined) unitData.critDamage = 0;

            // If this is a booster, we directly modify the crit chance.
            if (equipment.type == EquipmentType.CritBooster) {
                unitData.critChance += equipment.equipment.chance!;
            } else {
                unitData.critChance =
                    unitData.critChance + (equipment.equipment.chance! * (100 - unitData.critChance)) / 100;
            }
            unitData.critDamage += equipment.equipment.boost1[equipment.level! - 1];
        } else {
            // Defensive items like pauldrons and armor.
            const equip = equipment.equipment;
            // Boost health.
            if (equip.boost1.length > 0) unitData.health += equip.boost1[equipment.level! - 1];
            // Boost armor.
            if (equip.boost2.length > 0) unitData.armor += equip.boost2[equipment.level! - 1];
        }
        return unitData;
    }

    static runAttackSimulations(
        attacker: DamageUnitData,
        hits: number,
        type: DamageType,
        defender: DamageUnitData,
        totalSims: number
    ): number[] {
        const ret: number[] = [];
        const damage: number = attacker.damage;
        const critDamage: number = attacker.critDamage ?? 0;
        const blockDamage: number = defender.blockDamage ?? 0;
        const minDamage = Math.max(
            1,
            hits *
                this.getDamageFrom1Hit(
                    Math.max(0, damage * 0.8 - blockDamage * 1.2),
                    type,
                    defender.armor,
                    defender.gravis
                )
        );
        const maxDamage = Math.max(
            1,
            hits * this.getDamageFrom1Hit((damage + critDamage) * 1.2, type, defender.armor, false)
        );
        ret.push(Math.min(minDamage, defender.health));
        ret.push(Math.min(maxDamage, defender.health));
        for (let i = 2; i < totalSims; ++i) {
            let totalDamage: number = 0;
            let canCrit = attacker.critChance != undefined;
            let canBlock = type != DamageType.Psychic && defender.blockChance != undefined;
            for (let j = 0; j < hits; ++j) {
                const isCrit = canCrit && Math.random() * 100 <= attacker.critChance!;
                canCrit = canCrit && isCrit;
                const isBlock = canBlock && Math.random() * 100 <= defender.blockChance!;
                canBlock = canBlock && isBlock;
                const rng1 = 1 + (Math.round(Math.random() * 41) - 20) / 100.0;
                const rng2 = 1 + (Math.round(Math.random() * 41) - 20) / 100.0;
                const singleHitDamage = Math.round(
                    this.getDamageFrom1Hit(
                        (damage + (isCrit ? critDamage : 0)) * rng1,
                        type,
                        defender.armor,
                        defender.gravis && !isCrit
                    )
                );
                const blockedDamage = blockDamage * rng2;
                totalDamage += Math.max(0, singleHitDamage - (isBlock ? blockedDamage : 0));
            }
            totalDamage = Math.min(totalDamage, defender.health);
            ret.push(totalDamage);
        }
        ret.sort((a, b) => b - a);
        return ret;
    }

    /** @returns the pierce ratio in [0,100] for @type. */
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

    /** Parses a string into a @DamageType. */
    private static convertDamageType(type: string | undefined): DamageType | undefined {
        if (type == undefined) return undefined;
        return DamageType[type as keyof typeof DamageType];
    }

    /**
     * Computes the DAMVAR for a single hit, going twice if the defender has
     * gravis armor.
     */
    private static getDamageFrom1Hit(damage: number, type: DamageType, armor: number, gravis: boolean): number {
        const damageWithPierce = (damage * this.getPierce(type)) / 100.0;
        const damageOverArmor = damage - armor;
        const totalDamage = Math.round(Math.max(damageWithPierce, damageOverArmor));
        if (gravis) return this.getDamageFrom1Hit(totalDamage, type, armor, false);
        return totalDamage;
    }
}
