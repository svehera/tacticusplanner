import { FactionsService } from '@/fsd/5-shared/lib';
import { Alliance } from '@/fsd/5-shared/model';

import { npcData } from './data';
import { INpcData, INpcRawStats, INpcStats } from './model';

export class NpcService {
    static readonly npcDataFull: INpcData[] = this.convertNpcData();

    private static convertNpcData(): INpcData[] {
        console.log('Converting NPC data...', npcData);
        return npcData.map(npc => {
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
            closecombatweakness: 'combat_weakness',
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
