import { EquipmentType, INpcData } from 'src/models/interfaces';
import { StaticDataService } from 'src/services';

import { RarityStars, Rarity, DamageType, Faction, Rank, Trait } from '@/fsd/5-shared/model';

import { IUnitData, StatsCalculatorService } from '@/fsd/4-entities/character';

import { IEquipmentSpec } from './versus-interfaces';

export interface DamageUnitData {
    damage: number;
    armor: number;
    health: number;
    critDamage?: number;
    critChance?: number;
    blockDamages: number[];
    blockChances: number[];
    meleeHits: number;
    meleeType: DamageType;
    meleeModifiers: number;
    rangeHits?: number;
    rangeType?: DamageType;
    relevantTraits: Trait[];
}

/**
 * Exports several handy functions for calculating damage of one unit against
 * another. Typical use is to call runAttackSimulations and graph the result.
 */
export class DamageCalculatorService {
    static readonly relevantTraits: Trait[] = [
        Trait.BeastSlayer,
        Trait.BigTarget,
        Trait.Camouflage,
        Trait.CloseCombatWeakness,
        Trait.ContagionsOfNurgle,
        Trait.Daemon,
        Trait.Diminutive,
        Trait.Emplacement,
        Trait.GetStuckIn,
        Trait.Immune,
        Trait.LetTheGalaxyBurn,
        Trait.MKXGravis,
        Trait.Parry,
        Trait.Resilient,
        Trait.Swarm,
        Trait.Terrifying,
        Trait.TwoManTeam,
        Trait.Vehicle,
    ];

    static modifyAttacker(attacker: DamageUnitData, attackerTraits: Trait[], defenderTraits: Trait[]): DamageUnitData {
        const ret = { ...attacker };

        if (
            attackerTraits.includes(Trait.BeastSlayer) &&
            (defenderTraits.includes(Trait.BigTarget) || defenderTraits.includes(Trait.Vehicle))
        ) {
            ret.meleeModifiers *= 1.1;
        }
        if (defenderTraits.includes(Trait.Camouflage)) {
            if (attacker.rangeHits != undefined) {
                ret.rangeHits = Math.max(attacker.rangeHits - 1, 1);
            }
        }
        if (attackerTraits.includes(Trait.CloseCombatWeakness)) {
            ret.meleeModifiers *= 0.5;
        }
        if (defenderTraits.includes(Trait.Diminutive)) {
            ret.meleeHits = Math.max(attacker.meleeHits - 1, 1);
            if (ret.rangeHits != undefined) {
                ret.meleeHits = Math.max(ret.rangeHits - 1, 1);
            }
        }
        if (attackerTraits.includes(Trait.Emplacement)) {
            ret.meleeModifiers *= 0.5;
        }
        if (defenderTraits.includes(Trait.Diminutive)) {
            ret.meleeHits = Math.max(attacker.meleeHits - 1, 1);
        }
        if (defenderTraits.includes(Trait.Terrifying)) {
            ret.meleeModifiers *= 0.7;
        }

        return ret;
    }

    static modifyDefender(defender: DamageUnitData, attackerTraits: Trait[], defenderTraits: Trait[]): DamageUnitData {
        const ret = { ...defender };
        if (defenderTraits.includes(Trait.BeastSlayer)) {
            ret.blockChances.push(10);
            ret.blockChances.push(defender.health / 5);
        }
        if (!attackerTraits.includes(Trait.Immune)) {
            if (attackerTraits.includes(Trait.ContagionsOfNurgle)) {
                ret.armor *= Math.round(0.8);
            }
        }
        return ret;
    }

    static convertNpcTrait(unit: string, trait: string): Trait | undefined {
        let ret: Trait | undefined = undefined;
        Object.entries(Trait).forEach(([key, value]) => {
            if (trait == value) {
                ret = Trait[key as keyof typeof Trait];
            }
        });
        if (ret == undefined) {
            if (trait == 'Battle fatigue') return Trait.BattleFatigue;
            if (trait == 'Mk X Gravis') return Trait.MKXGravis;
            if (trait == 'Suppressive fire') return Trait.SuppressiveFire;
            if (trait == '2-man Team') return Trait.TwoManTeam;
        }
        return ret;
    }

    static isRelevantTrait(unit: string, trait: string): boolean {
        const strongTrait = this.convertNpcTrait(unit, trait);
        if (strongTrait == undefined) {
            console.error('unknown trait ' + trait);
            return false;
        }
        return this.relevantTraits.includes(strongTrait);
    }

    static getRelevantNpcTraits(npc: INpcData): Trait[] {
        return npc.traits
            .filter(trait => this.isRelevantTrait(npc.name, trait))
            .map(trait => Trait[trait as keyof typeof Trait]);
    }

    static getRelevantCharacterTraits(character: IUnitData): Trait[] {
        return character.traits.filter(trait => this.relevantTraits.includes(trait));
    }

    static modifyWithTraits(traits: Trait[], data: DamageUnitData): DamageUnitData {
        if (traits.includes(Trait.Daemon)) {
            data.blockChances.push(25);
            data.blockDamages.push(data.health / 2);
        }
        if (traits.includes(Trait.BeastSlayer)) {
            data.blockChances.push(10);
            data.blockChances.push(data.health / 5);
        }
        return data;
    }

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
            return this.modifyWithTraits(this.getRelevantNpcTraits(npc), {
                damage: StatsCalculatorService.calculateNpcDamage(npc.name, stars, rank),
                armor: StatsCalculatorService.calculateNpcArmor(npc.name, stars, rank),
                health: StatsCalculatorService.calculateNpcHealth(npc.name, stars, rank),
                meleeHits: npc.meleeHits,
                meleeType: this.convertDamageType(npc.meleeType)!,
                meleeModifiers: 100,
                blockChances: [],
                blockDamages: [],
                rangeHits: npc.rangeHits,
                rangeType: this.convertDamageType(npc.rangeType),
                relevantTraits: this.getRelevantNpcTraits(npc),
            });
        }
        const unit = StaticDataService.unitsData.find(unit => unit.id === id)!;
        let unitData: DamageUnitData = {
            damage: StatsCalculatorService.calculateDamage(unit.id, rarity, stars, rank, 0),
            armor: StatsCalculatorService.calculateArmor(unit.id, rarity, stars, rank, 0),
            health: StatsCalculatorService.calculateHealth(unit.id, rarity, stars, rank, 0),
            meleeHits: unit.meleeHits,
            meleeType: unit.damageTypes.melee,
            meleeModifiers: 100,
            blockChances: [],
            blockDamages: [],
            rangeHits: unit.rangeHits,
            rangeType: unit.damageTypes.range,
            relevantTraits: this.getRelevantCharacterTraits(unit),
        };
        equipment.forEach(equip => (unitData = this.adjustUnitData(unitData, equip)));
        return this.modifyWithTraits(unit.traits, unitData);
    }

    static adjustUnitData(unitData: DamageUnitData, equipment: IEquipmentSpec): DamageUnitData {
        if (equipment.equipment == undefined) return unitData;
        if (equipment.type == EquipmentType.Block || equipment.type == EquipmentType.BlockBooster) {
            let chance = unitData.blockChances.length == 0 ? 0 : unitData.blockChances[0];
            let damage = unitData.blockDamages.length == 0 ? 0 : unitData.blockDamages[0];
            chance += equipment.equipment.chance!;
            damage += equipment.equipment.boost1[equipment.level! - 1];
            if (unitData.blockChances.length == 0) {
                unitData.blockChances.push(chance);
                unitData.blockDamages.push(damage);
            } else {
                unitData.blockChances[0] = chance;
                unitData.blockDamages[0] = damage;
            }
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
        attacker = this.modifyAttacker(attacker, attacker.relevantTraits, defender.relevantTraits);
        defender = this.modifyDefender(defender, attacker.relevantTraits, defender.relevantTraits);
        const ret: number[] = [];
        const damage: number = attacker.damage;
        const critDamage: number = attacker.critDamage ?? 0;
        const blockDamage: number = defender.blockDamages[0] ?? 0;
        // Modifiers happen after the second pass through gravis, they happen before
        // blocks, and they are not subject to the usual 20% variance.
        const minDamage = Math.max(
            1,
            hits *
                this.getDamageFrom1Hit(
                    Math.max(0, damage * 0.8 - blockDamage * 1.2),
                    type,
                    defender.armor,
                    defender.relevantTraits.includes(Trait.MKXGravis)
                )
        );
        const maxDamage = Math.max(
            1,
            hits * this.getDamageFrom1Hit((damage + critDamage) * 1.2, type, defender.armor, /*gravis=*/ false)
        );
        ret.push(Math.min(minDamage, defender.health));
        ret.push(Math.min(maxDamage, defender.health));
        // TODO - adjust hits for Get Stuck In.
        // TODO - adjust hits for Let The Galaxy Burn.
        for (let i = 2; i < totalSims; ++i) {
            let totalDamage: number = 0;
            let canCrit = attacker.critChance != undefined;
            let canBlock = type != DamageType.Psychic && defender.blockChances[0] != undefined;
            for (let j = 0; j < hits; ++j) {
                const isCrit = canCrit && Math.random() * 100 <= attacker.critChance!;
                canCrit = canCrit && isCrit;
                const isBlock = canBlock && Math.random() * 100 <= defender.blockChances[0]!;
                canBlock = canBlock && isBlock;
                const rng1 = 1 + (Math.round(Math.random() * 41) - 20) / 100.0;
                const rng2 = 1 + (Math.round(Math.random() * 41) - 20) / 100.0;
                const singleHitDamage = Math.round(
                    this.getDamageFrom1Hit(
                        (damage + (isCrit ? critDamage : 0)) * rng1,
                        type,
                        defender.armor,
                        !isCrit && defender.relevantTraits.includes(Trait.MKXGravis)
                    )
                );
                const blockedDamage = blockDamage * rng2;
                totalDamage += Math.max(0, singleHitDamage - (isBlock ? blockedDamage : 0));
            }
            totalDamage = Math.min(totalDamage, defender.health);
            ret.push(totalDamage);
            // TODO - deal with Resilient.
            // TODO - deal with Swarm.
            // TODO - deal with Two-Man Team.
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
