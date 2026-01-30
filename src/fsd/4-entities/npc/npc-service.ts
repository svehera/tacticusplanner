import { createSafeGetter, mutableCopy } from '@/fsd/5-shared/lib';
import { Alliance, DamageType } from '@/fsd/5-shared/model';

import { npcData } from './data';
import { INpcData, INpcRawStats, INpcStats } from './model';

const safeGet = createSafeGetter<typeof npcData>();

export class NpcService {
    static readonly npcDataFull: INpcData[] = this.convertNpcData();

    private static convertNpcData(): INpcData[] {
        return npcData.map(npc => {
            return {
                snowprintId: npc.id,
                name: npc.Name,
                faction: npc.Faction || undefined, // source data has empty string for some NPCs (e.g. loot objects)
                alliance: npc.Alliance ? (npc.Alliance as Alliance) : undefined,
                meleeDamage: npc['Melee Damage'],
                meleeHits: npc['Melee Hits'],
                rangeDamage: safeGet(npc, 'Ranged Damage'),
                rangeHits: safeGet(npc, 'Ranged Hits'),
                rangeDistance: safeGet(npc, 'Distance'),
                movement: npc.Movement,
                traits: mutableCopy(npc.Traits),
                icon: npc.Icon,
                activeAbilities: mutableCopy(safeGet(npc, 'Active Abilities') ?? []),
                passiveAbilities: mutableCopy(safeGet(npc, 'Passive Abilities') ?? []),
                activeAbilityDamage: mutableCopy(safeGet(npc, 'Active Ability Damage') ?? []),
                passiveAbilityDamage: mutableCopy(safeGet(npc, 'Passive Ability Damage') ?? []),
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

    /**
     * Maps a game trait name to its corresponding icon file name.
     * @param traitName The name of the trait (e.g., "ActOfFaith", "BeastSnagga").
     * @returns The icon name (e.g., "act_of_faith", "beast_snagga") or null if no match is found.
     */
    public static getTraitIcon(traitName: string): string | null {
        // Standardize the input trait name to handle various casing styles
        // before checking the map.
        const key = traitName.toLowerCase();

        // The mapping object (effectively a constant lookup table)
        const traitToIconMap: { [key: string]: string } = {
            actoffaith: 'act_of_faith',
            ambush: 'ambush',
            battlefatigue: 'battle_fatigue',
            beastsnagga: 'beast_slayer',
            bigtarget: 'big_target',
            boss: 'boss_adjutant',
            camouflage: 'camouflage',
            closecombatweakness: 'ranged_specialist',
            contagionsofnurgle: 'contagions',
            crushingstrike: 'crushing_strike',
            daemon: 'daemonic',
            diminutive: 'diminuitive',
            emplacement: 'emplacement',
            explodes: 'explodes',
            finaljustice: 'only_in_death',
            flying: 'flying',
            getstuckin: 'beast_snagga',
            healer: 'healer',
            heavyweapon: 'heavy_weapon',
            immune: 'immune',
            impervious: 'impervious',
            indirectfire: 'indirect_fire',
            infiltrate: 'infiltrate',
            instinctivebehaviour: 'instinctive_behaviour',
            letthegalaxyburn: 'let_the_galaxy_burn',
            livingmetal: 'livingmetall',
            martialkatah: 'martial_katah',
            mechanic: 'mechanic',
            mechanical: 'mechanical',
            mkxgravis: 'mk_gravis',
            object: 'object',
            overwatch: 'overwatch',
            parry: 'parry',
            psyker: 'psychic',
            putridexplosion: 'putrid_explosion',
            rapidassault: 'rapid_assault',
            rangedspecialist: 'ranged_specialist',
            resilient: 'resilient',
            shadowinthewap: 'shadow_in_the_warp',
            steppable: 'steppable',
            summon: 'summon',
            suppressivefire: 'supressive_fire',
            swarm: 'swarm',
            synapse: 'synapse',
            teleportstrike: 'teleport_strike',
            terminatorarmour: 'terminator_amour',
            terrifying: 'terrifying',
            thrillseekers: 'thrill_seekers',
            twomanteam: '2_man_team',
            unstoppable: 'mounted',
            vehicle: 'vehicle',
            weaveroffate: 'weavers_of_fate',
        };

        const img = traitToIconMap[key];
        if (img === undefined) return img;

        return 'snowprint_assets/traits/ui_icon_trait_' + img + '_01.png';
    }
}
