import { FactionsService } from '@/fsd/5-shared/lib';
import { Alliance, DamageType } from '@/fsd/5-shared/model';

import { TraitKey, TRAIT_MAP, isValidTraitKey } from '../character/@x/trait';

import { npcData } from './data';
import { INpcData, INpcRawStats, INpcStats } from './model';

const areValidTraits = (strings: string[]): strings is TraitKey[] => !strings.some(s => !isValidTraitKey(s));

export class NpcService {
    static readonly npcDataFull: INpcData[] = this.convertNpcData();

    private static convertNpcData(): INpcData[] {
        return npcData.map(npc => {
            if (!areValidTraits(npc.Traits)) {
                const invalidTraits = npc.Traits.filter(t => !isValidTraitKey(t));
                throw new Error(`invalid traits found: ${invalidTraits}`);
            }
            return {
                snowprintId: npc.id,
                name: npc.Name,
                faction: FactionsService.safeSnowprintFactionToFaction(npc.Faction),
                alliance: npc.Alliance ? (npc.Alliance as Alliance) : undefined,
                meleeDamage: npc['Melee Damage'],
                meleeHits: npc['Melee Hits'],
                rangeDamage: npc['Ranged Damage'],
                rangeHits: npc['Ranged Hits'],
                rangeDistance: npc.Distance,
                movement: npc.Movement,
                traits: npc.Traits,
                icon: npc.Icon,
                activeAbilities: npc['Active Abilities'] ?? [],
                passiveAbilities: npc['Passive Abilities'] ?? [],
                activeAbilityDamage: npc['Active Ability Damage'],
                passiveAbilityDamage: npc['Passive Ability Damage'],
                stats: npc.Stats.map(
                    (stat: INpcRawStats) =>
                        ({
                            abilityLevel: stat.AbilityLevel,
                            damage: stat.Damage,
                            armor: stat.Armor,
                            health: stat.Health,
                            progressionIndex: stat.ProgressionIndex,
                            rank: stat.Rank + 1,
                            rarityStars: stat.Stars,
                        }) as INpcStats
                ),
            };
        });
    }

    /** @returns the NPC with the given snowprint ID, or undefined if one doesn't exist. */
    public static getNpcById(id: string): INpcData | undefined {
        const npc = this.npcDataFull.find(npc => npc.snowprintId === id);
        return npc ?? undefined;
    }

    /** @returns the pierce ratio for the specified damage type, or -1 if the type is invalid. */
    public static getPierce(damageType: DamageType): number {
        switch (damageType) {
            case DamageType.Bio:
                return 0.3;
            case DamageType.Blast:
                return 0.15;
            case DamageType.Bolter:
                return 0.2;
            case DamageType.Chain:
                return 0.15;
            case DamageType.Direct:
                return 1.0;
            case DamageType.Energy:
                return 0.3;
            case DamageType.Eviscerate:
                return 0.5;
            case DamageType.Flame:
                return 0.25;
            case DamageType.HeavyRound:
                return 0.55;
            case DamageType.Las:
                return 0.1;
            case DamageType.Melta:
                return 0.75;
            case DamageType.Molecular:
                return 0.6;
            case DamageType.Particle:
                return 0.35;
            case DamageType.Physical:
                return 0.01;
            case DamageType.Piercing:
                return 0.8;
            case DamageType.Plasma:
                return 0.6;
            case DamageType.Power:
                return 0.4;
            case DamageType.Projectile:
                return 0.15;
            case DamageType.Pulse:
                return 0.2;
            case DamageType.Psychic:
                return 1.0;
            case DamageType.Toxic:
                return 0.7;
            default:
                return -1;
        }
    }

    public static getTraitIcon(traitName: TraitKey) {
        return TRAIT_MAP[traitName].icon;
    }
}
