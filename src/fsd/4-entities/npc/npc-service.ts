/* eslint-disable import-x/no-internal-modules */
import twomanteam from '@/assets/images/snowprint_assets/traits/ui_icon_trait_2_man_team_01.png';
import actoffaith from '@/assets/images/snowprint_assets/traits/ui_icon_trait_act_of_faith_01.png';
import ambush from '@/assets/images/snowprint_assets/traits/ui_icon_trait_ambush_01.png';
import battlefatigue from '@/assets/images/snowprint_assets/traits/ui_icon_trait_battle_fatigue_01.png';
import beastsnagga from '@/assets/images/snowprint_assets/traits/ui_icon_trait_beast_slayer_01.png';
import getstuckin from '@/assets/images/snowprint_assets/traits/ui_icon_trait_beast_snagga_01.png';
import bigtarget from '@/assets/images/snowprint_assets/traits/ui_icon_trait_big_target_01.png';
import boss from '@/assets/images/snowprint_assets/traits/ui_icon_trait_boss_adjutant_01.png';
import camouflage from '@/assets/images/snowprint_assets/traits/ui_icon_trait_camouflage_01.png';
import contagionsofnurgle from '@/assets/images/snowprint_assets/traits/ui_icon_trait_contagions_01.png';
import crushingstrike from '@/assets/images/snowprint_assets/traits/ui_icon_trait_crushing_strike_01.png';
import daemon from '@/assets/images/snowprint_assets/traits/ui_icon_trait_daemonic_01.png';
import diminutive from '@/assets/images/snowprint_assets/traits/ui_icon_trait_diminuitive_01.png';
import emplacement from '@/assets/images/snowprint_assets/traits/ui_icon_trait_emplacement_01.png';
import explodes from '@/assets/images/snowprint_assets/traits/ui_icon_trait_explodes_01.png';
import flying from '@/assets/images/snowprint_assets/traits/ui_icon_trait_flying_01.png';
import healer from '@/assets/images/snowprint_assets/traits/ui_icon_trait_healer_01.png';
import heavyweapon from '@/assets/images/snowprint_assets/traits/ui_icon_trait_heavy_weapon_01.png';
import immune from '@/assets/images/snowprint_assets/traits/ui_icon_trait_immune_01.png';
import impervious from '@/assets/images/snowprint_assets/traits/ui_icon_trait_impervious_01.png';
import indirectfire from '@/assets/images/snowprint_assets/traits/ui_icon_trait_indirect_fire_01.png';
import infiltrate from '@/assets/images/snowprint_assets/traits/ui_icon_trait_infiltrate_01.png';
import instinctivebehaviour from '@/assets/images/snowprint_assets/traits/ui_icon_trait_instinctive_behaviour_01.png';
import letthegalaxyburn from '@/assets/images/snowprint_assets/traits/ui_icon_trait_let_the_galaxy_burn_01.png';
import livingmetal from '@/assets/images/snowprint_assets/traits/ui_icon_trait_livingmetall_01.png';
import martialkatah from '@/assets/images/snowprint_assets/traits/ui_icon_trait_martial_katah_01.png';
import mechanic from '@/assets/images/snowprint_assets/traits/ui_icon_trait_mechanic_01.png';
import mechanical from '@/assets/images/snowprint_assets/traits/ui_icon_trait_mechanical_01.png';
import mkxgravis from '@/assets/images/snowprint_assets/traits/ui_icon_trait_mk_gravis_01.png';
import unstoppable from '@/assets/images/snowprint_assets/traits/ui_icon_trait_mounted_01.png';
import object from '@/assets/images/snowprint_assets/traits/ui_icon_trait_object_01.png';
import finaljustice from '@/assets/images/snowprint_assets/traits/ui_icon_trait_only_in_death_01.png';
import overwatch from '@/assets/images/snowprint_assets/traits/ui_icon_trait_overwatch_01.png';
import parry from '@/assets/images/snowprint_assets/traits/ui_icon_trait_parry_01.png';
import psyker from '@/assets/images/snowprint_assets/traits/ui_icon_trait_psychic_01.png';
import putridexplosion from '@/assets/images/snowprint_assets/traits/ui_icon_trait_putrid_explosion_01.png';
import rangedspecialist from '@/assets/images/snowprint_assets/traits/ui_icon_trait_ranged_specialist_01.png';
import rapidassault from '@/assets/images/snowprint_assets/traits/ui_icon_trait_rapid_assault_01.png';
import resilient from '@/assets/images/snowprint_assets/traits/ui_icon_trait_resilient_01.png';
import shadowinthewap from '@/assets/images/snowprint_assets/traits/ui_icon_trait_shadow_in_the_warp_01.png';
import steppable from '@/assets/images/snowprint_assets/traits/ui_icon_trait_steppable_01.png';
import summon from '@/assets/images/snowprint_assets/traits/ui_icon_trait_summon_01.png';
import suppressivefire from '@/assets/images/snowprint_assets/traits/ui_icon_trait_supressive_fire_01.png';
import swarm from '@/assets/images/snowprint_assets/traits/ui_icon_trait_swarm_01.png';
import synapse from '@/assets/images/snowprint_assets/traits/ui_icon_trait_synapse_01.png';
import teleportstrike from '@/assets/images/snowprint_assets/traits/ui_icon_trait_teleport_strike_01.png';
import terminatorarmour from '@/assets/images/snowprint_assets/traits/ui_icon_trait_terminator_amour_01.png';
import terrifying from '@/assets/images/snowprint_assets/traits/ui_icon_trait_terrifying_01.png';
import thrillseekers from '@/assets/images/snowprint_assets/traits/ui_icon_trait_thrill_seekers_01.png';
import vehicle from '@/assets/images/snowprint_assets/traits/ui_icon_trait_vehicle_01.png';
import weaveroffate from '@/assets/images/snowprint_assets/traits/ui_icon_trait_weavers_of_fate_01.png';
/* eslint-enable import-x/no-internal-modules */

import { FactionsService } from '@/fsd/5-shared/lib';
import { Alliance, DamageType } from '@/fsd/5-shared/model';

import { npcData } from './data';
import { INpcData, INpcRawStats, INpcStats } from './model';

// The mapping of trait names to their corresponding image isn't as 1-to-1 as
// other assets (where there's a JSON listing the traits and their icons), so we
// have to do it manually here.
const traitIconMap = {
    actoffaith,
    ambush,
    battlefatigue,
    beastsnagga,
    bigtarget,
    boss,
    camouflage,
    closecombatweakness: rangedspecialist, // close combat weakness is the old name for ranged specialist
    contagionsofnurgle,
    crushingstrike,
    daemon,
    diminutive,
    emplacement,
    explodes,
    finaljustice,
    flying,
    getstuckin,
    healer,
    heavyweapon,
    immune,
    impervious,
    indirectfire,
    infiltrate,
    instinctivebehaviour,
    letthegalaxyburn,
    livingmetal,
    martialkatah,
    mechanic,
    mechanical,
    mkxgravis,
    object,
    overwatch,
    parry,
    psyker,
    putridexplosion,
    rapidassault,
    rangedspecialist,
    resilient,
    shadowinthewap,
    steppable,
    summon,
    suppressivefire,
    swarm,
    synapse,
    teleportstrike,
    terminatorarmour,
    terrifying,
    thrillseekers,
    twomanteam,
    unstoppable,
    vehicle,
    weaveroffate,
} as const;

type TraitKey = keyof typeof traitIconMap;
const isValidTrait = (traitName: string): traitName is TraitKey => traitName in traitIconMap;

export class NpcService {
    static readonly npcDataFull: INpcData[] = this.convertNpcData();

    private static convertNpcData(): INpcData[] {
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
     * @returns The URL of the image if is found, or null if it is not.
     */
    public static getTraitIcon(traitName: string) {
        // Standardize the input trait name to handle various casing styles
        // before checking the map.
        const key = traitName.toLowerCase();
        return isValidTrait(key) ? traitIconMap[key] : null;
    }
}
