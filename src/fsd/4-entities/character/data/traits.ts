/* eslint-disable import-x/no-internal-modules */

/*
 * The mapping of the trait name shown to users to the actual icon file name
 * isn't as 1:1 as the other assets (where we often have a JSON file that maps them).
 * This is because some public names differ from the icon file names.
 * (e.g. "Get Stuck In" => ui_icon_trait_beast_snagga_01.png)
 * Other times there's just a typo in the icon file nome (e.g. ui_icon_trait_livingmetall_01).
 *
 * In addition, the trait keys used to identify traits in code differ from both the
 * public-facing names and the icon file names.
 *
 * The following mapping is of our own making to connect the three together.
 */

// Our assets; used only when no snowprint asset is available
import ui_icon_trait_mow_01 from 'src/assets/images/icons/mow.png';
// Snowprint assets
import ui_icon_trait_2_man_team_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_2_man_team_01.png';
import ui_icon_trait_act_of_faith_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_act_of_faith_01.png';
import ui_icon_trait_ambush_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_ambush_01.png';
import ui_icon_trait_battle_fatigue_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_battle_fatigue_01.png';
import ui_icon_trait_beast_slayer_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_beast_slayer_01.png';
import ui_icon_trait_beast_snagga_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_beast_snagga_01.png';
import ui_icon_trait_big_target_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_big_target_01.png';
import ui_icon_trait_blessing_of_khorne_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_blessing_of_khorne_01.png';
import ui_icon_trait_boss_adjutant_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_boss_adjutant_01.png';
import ui_icon_trait_camouflage_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_camouflage_01.png';
import ui_icon_trait_combat_weakness_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_combat_weakness_01.png';
import ui_icon_trait_contagions_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_contagions_01.png';
import ui_icon_trait_crushing_strike_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_crushing_strike_01.png';
import ui_icon_trait_daemonic_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_daemonic_01.png';
import ui_icon_trait_diminuitive_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_diminuitive_01.png';
import ui_icon_trait_emplacement_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_emplacement_01.png';
import ui_icon_trait_explodes_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_explodes_01.png';
import ui_icon_trait_flying_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_flying_01.png';
import ui_icon_trait_healer_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_healer_01.png';
import ui_icon_trait_heavy_weapon_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_heavy_weapon_01.png';
import ui_icon_trait_immune_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_immune_01.png';
import ui_icon_trait_impervious_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_impervious_01.png';
import ui_icon_trait_indirect_fire_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_indirect_fire_01.png';
import ui_icon_trait_infiltrate_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_infiltrate_01.png';
import ui_icon_trait_instinctive_behaviour_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_instinctive_behaviour_01.png';
import ui_icon_trait_let_the_galaxy_burn_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_let_the_galaxy_burn_01.png';
import ui_icon_trait_livingmetall_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_livingmetall_01.png';
import ui_icon_trait_martial_katah_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_martial_katah_01.png';
import ui_icon_trait_mechanic_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_mechanic_01.png';
import ui_icon_trait_mechanical_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_mechanical_01.png';
import ui_icon_trait_mk_gravis_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_mk_gravis_01.png';
import ui_icon_trait_mounted_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_mounted_01.png';
import ui_icon_trait_object_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_object_01.png';
import ui_icon_trait_only_in_death_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_only_in_death_01.png';
import ui_icon_trait_overwatch_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_overwatch_01.png';
import ui_icon_trait_parry_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_parry_01.png';
import ui_icon_trait_psychic_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_psychic_01.png';
import ui_icon_trait_putrid_explosion_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_putrid_explosion_01.png';
import ui_icon_trait_ranged_specialist_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_ranged_specialist_01.png';
import ui_icon_trait_rapid_assault_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_rapid_assault_01.png';
import ui_icon_trait_resilient_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_resilient_01.png';
import ui_icon_trait_shadow_in_the_warp_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_shadow_in_the_warp_01.png';
import ui_icon_trait_steppable_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_steppable_01.png';
import ui_icon_trait_summon_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_summon_01.png';
import ui_icon_trait_supressive_fire_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_supressive_fire_01.png';
import ui_icon_trait_swarm_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_swarm_01.png';
import ui_icon_trait_synapse_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_synapse_01.png';
import ui_icon_trait_teleport_strike_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_teleport_strike_01.png';
import ui_icon_trait_terminator_amour_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_terminator_amour_01.png';
import ui_icon_trait_terrifying_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_terrifying_01.png';
import ui_icon_trait_thrill_seekers_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_thrill_seekers_01.png';
import ui_icon_trait_tile_decoy from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_tile_decoy.png';
import ui_icon_trait_unknown_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_unknown_01.png';
import ui_icon_trait_vehicle_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_vehicle_01.png';
import ui_icon_trait_weavers_of_fate_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_weavers_of_fate_01.png';
/*
// Snowprint assets that are not currently in the mapping; TBD if they're unused or we just don't where they fit yet
import ui_icon_trait_networked_targeting_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_networked_targeting_01.png';
import ui_icon_trait_burnedbylight_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_burnedbylight_01.png';
import ui_icon_trait_battle_fatigue_flyout from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_battle_fatigue_flyout.png';
import ui_icon_trait_tile_bombardment from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_tile_bombardment.png';
import ui_icon_trait_tile_elevation from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_tile_elevation.png';
import ui_icon_trait_tile_trench from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_tile_trench.png';
import ui_icon_trait_false_emperor_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_false_emperor_01.png';

// afaik Dakka was the pre-rework faction trait for Orks
import ui_icon_trait_dakka_01 from 'src/assets/images/snowprint_assets/traits/ui_icon_trait_dakka_01.png';
*/

import traitList from './traits-generated.json';

export type TraitKey = keyof typeof traitList;

export const TRAIT_MAP: {
    [key in TraitKey]: {
        icon: string; // the icon import
        name: string; // the in-game name
        description: string; // the in-game description
    };
} = {
    ActOfFaith: {
        icon: ui_icon_trait_act_of_faith_01,
        name: 'Act of Faith',
        description:
            'This units gets +10% Crit Chance and increases their Crit Damage by 25% each time a friendly Imperial unit dies or kills an enemy unit. Once this unit or a friendly unit with Act of Faith crits, this bonus resets.',
    },
    Ambush: {
        icon: ui_icon_trait_ambush_01,
        name: 'Ambush',
        description:
            'The first time this unit is defeated, it leaves behind a Decoy and at the beginning of their next turn, if there is still a friendly decoy on the battlefield, it is resurrected with full Health on a random friendly decoy and can immediately take a turn. Characters resurrect before non-Character units.',
    },
    BattleFatigue: {
        icon: ui_icon_trait_battle_fatigue_01,
        name: 'Battle Fatigue',
        description:
            'If a friendly unit is defeated in an adjacent hex, there is a 10% chance that the unit with this trait flees and is removed from the battle. +40% if Overkilled.',
    },
    BeastSnagga: {
        // Something odd is going on here:
        // Snotflogga has two traits:
        //  - in the code: "Get Stuck In" and "BeastSnagga".
        //  - in the UI: "Get Stuck In" and "Beast Slayer".
        // The icon `ui_icon_trait_beast_snagga_01` visually matches the trait "Get Stuck In" in the game
        // The conclusion is
        //   - the file name is misleading, and `ui_icon_trait_beast_snagga_01` is actually the icon for "Get Stuck In"
        //   - the trait "BeastSnagga" should be displayed as "Beast Slayer" in the UI
        icon: ui_icon_trait_beast_slayer_01,
        name: 'Beast Slayer',
        description:
            'Deals +20% melee damage to Big Targets and Vehicles. Has an added 10% chance to Block 20% of its max health as damage.',
    },
    BigTarget: {
        icon: ui_icon_trait_big_target_01,
        name: 'Big Target',
        description:
            'Does not get any bonuses from Tall Grass and Trenches. Adjacent friendly units receive -1 hit from ranged attacks (to a minimum of 1). This unit cannot be displaced.',
    },
    BlessingsOfKhorne: {
        icon: ui_icon_trait_blessing_of_khorne_01,
        name: 'Blessings of Khorne',
        description:
            'Deals 3% more damage and receives 8% less Psychic Damage for each unit that was defeated in melee this battle. Counts up to a maximum of 8 defeated units.',
    },
    Boss: {
        // ToDo: Get proper name+description from in-game; This trait appears on some guild raid bosses
        icon: ui_icon_trait_boss_adjutant_01,
        name: 'Placeholder: Boss trait name',
        description: 'Placeholder: Boss trait description',
    },
    Camouflage: {
        icon: ui_icon_trait_camouflage_01,
        name: 'Camouflage',
        description:
            'Ranged attacks against this character score -1 Hit. This increases to -2 Hits if this character is more than 2 hexes away from the attacker or to -3 Hits when in Tall Grass. Attackers always score at least 1 Hit.',
    },
    CloseCombatWeakness: {
        // Being phased out in favour of RangedSpecialist
        icon: ui_icon_trait_combat_weakness_01,
        name: 'Close Combat Weakness',
        description:
            'Whenever this unit is adjacent - or started the turn adjacent - to enemy units, it deals -50% Melee Damage and -25% Ranged Damage.',
    },
    ContagionsOfNurgle: {
        icon: ui_icon_trait_contagions_01,
        name: 'Contagions of Nurgle',
        description:
            'Aura: All non-Chaos units in one aura get a temporary -20% reduction to their armour. -40% if in two or more overlapping auras.\nThe aura scales in size as the battle goes on.\nRound 1-2: Range 1 (surrounding hexes only)\nRound 3-4: Range 2\nRound 5+: Range 3',
    },
    CrushingStrike: {
        icon: ui_icon_trait_crushing_strike_01,
        name: 'Crushing Strike',
        description:
            'Using its mighty but cumbersome melee weapons, this unit deals +50% Damage with normal Melee attacks if it has not moved this turn.',
    },
    Daemon: {
        icon: ui_icon_trait_daemonic_01,
        name: 'Daemon',
        description: 'This unit has an additional 25% chance to block up to 50% of its own current damage stat.',
    },
    Decoy: {
        // Todo: Get proper name+description from in-game; This trait appears on the decoy left behind by some Genestealer effects
        icon: ui_icon_trait_tile_decoy,
        name: 'Placeholder: Decoy trait name',
        description: 'Placeholder: Decoy trait description',
    },
    Diminutive: {
        // ToDo: Get proper name+description from in-game; This trait appears on grots
        icon: ui_icon_trait_diminuitive_01, // typo in asset name
        name: 'Placeholder: Diminutive trait name',
        description: 'Placeholder: Diminutive trait description',
    },
    Emplacement: {
        // ToDo: Add proper name+description; This trait appears on Cadian las & mortar teams
        icon: ui_icon_trait_emplacement_01,
        name: 'Placeholder: Emplacement trait name',
        description: 'Placeholder: Emplacement trait description',
    },
    Explodes: {
        icon: ui_icon_trait_explodes_01,
        name: 'Explodes',
        description: 'This unit explodes on death, dealing 25% of its max health as damage to all adjacent units.',
    },
    FinalJustice: {
        icon: ui_icon_trait_only_in_death_01, // Significant difference between trait key and asset name
        name: 'Final Vengeance', // Significant difference between trait key and in-game name
        description:
            'When this unit loses its last health, it immediately performs a normal attack on an eligible target and is then defeated as normal, unless Overkilled.',
    },
    Flying: {
        icon: ui_icon_trait_flying_01,
        name: 'Flying',
        description:
            'Can traverse impassable hexes and enemies and move between any elevation. Does not get any bonuses from Tall Grass and Trenches.',
    },
    GetStuckIn: {
        icon: ui_icon_trait_beast_snagga_01, // See comment above in BeastSnagga
        name: 'Get Stuck In',
        description:
            'For every 2 hits this unit scores with an attack against an enemy within range 2, it has a 30% chance to score an additional hit. If 2 or more friendly Orks or 4 or more friendly units are adjacent to the target, the chance is increased to 100%.',
    },
    Healer: {
        icon: ui_icon_trait_healer_01,
        name: 'Healer',
        description:
            "Can heal a friendly unit as its action. The amount of Health restored equals the Healer's Damage multiplied by the highest number of hits of any of their weapons.",
    },
    HeavyWeapon: {
        icon: ui_icon_trait_heavy_weapon_01,
        name: 'Heavy Weapon',
        description: 'Deals +25% Damage with Ranged attacks if it has not moved this turn.',
    },
    Immune: {
        icon: ui_icon_trait_immune_01,
        name: 'Immune',
        description:
            'This unit is immune to special hexes and hex effects, and cannot have its Armour, Hits, Movement, or Range reduced.\nAdditionally, this unit cannot be Stunned, Suppressed, or Taunted, and does not receive knockback damage.',
    },
    Impervious: {
        icon: ui_icon_trait_impervious_01,
        name: 'Impervious',
        description: 'Has to be hit by a Crit to take any Damage, but is instantly defeated by a Crit.',
    },
    IndirectFire: {
        icon: ui_icon_trait_indirect_fire_01,
        name: 'Indirect Fire',
        description: 'Can fire over obscuring hexes and ignores Trenches.',
    },
    Infiltrate: {
        icon: ui_icon_trait_infiltrate_01,
        name: 'Infiltrate',
        description: 'This unit does not trigger Overwatch',
    },
    InstinctiveBehaviour: {
        icon: ui_icon_trait_instinctive_behaviour_01,
        name: 'Instinctive Behaviour',
        description: 'This unit must attack its closest enemy if there are targets in range',
    },
    Invincible: {
        // ToDo: Add proper name+icon+description; This trait appears on buff objects like Health Power Ups
        icon: ui_icon_trait_unknown_01,
        name: 'Placeholder: Invincible trait name',
        description: 'Placeholder: Invincible trait description',
    },
    LetTheGalaxyBurn: {
        icon: ui_icon_trait_let_the_galaxy_burn_01,
        name: 'Let the Galaxy Burn',
        description:
            'All attacks have a 33% chance to score an additional hit and add Despoiled Ground to the hex of the attacked unit. If the attacked unit is already on a hex with a hex effect, the attack automatically scores an additional hit but does not add Despoiled Ground',
    },
    LivingMetal: {
        icon: ui_icon_trait_livingmetall_01,
        name: 'Living Metal',
        description: 'Regenerates 10% of its max Health at the start of each turn. This unit is also Mechanical.',
    },
    MachineOfWar: {
        icon: ui_icon_trait_mow_01,
        name: 'Machine of War',
        description:
            'Machines of War stand beside the battlefield and provide two additional powerful abilities to use multiple times during the battle. Some of them cost Munitions and some have a cooldown before you can use them. Machines of War cannot be targeted in their off-battlefield position and are destroyed when a battle is lost.\n\nNot every game mode allows to field Machines of War!',
    },
    MartialKatah: {
        icon: ui_icon_trait_martial_katah_01,
        name: "Martial Ka'tah",
        description:
            'Normal Attacks against this unit deal -20% Damage. This unit deals +100% Damage with all attacks against Summons.',
    },
    Mechanic: {
        icon: ui_icon_trait_mechanic_01,
        name: 'Mechanic',
        description:
            "Can Repair a friendly Mechanical unit as its action. The amount of Health restored equals the Mechanic's Damage multiplied by the highest number of hits of any of their weapons.",
    },
    Mechanical: {
        icon: ui_icon_trait_mechanical_01,
        name: 'Mechanical',
        description: 'Cannot be Healed, but can be Repaired instead.',
    },
    MkXGravis: {
        icon: ui_icon_trait_mk_gravis_01,
        name: 'MK X Gravis',
        description: 'Any incoming Damage has to go through Armor a second time. Does not apply to Critical hits.',
    },
    NonAttacking: {
        // ToDo: Add proper name+icon+description; This trait appears on loot grots in Salvage Mode
        icon: ui_icon_trait_unknown_01,
        name: 'Placeholder: Non-Attacking name',
        description: 'Placeholder: Non-Attacking description',
    },
    Object: {
        icon: ui_icon_trait_object_01,
        name: 'Object',
        description:
            'Automatically takes its action, if any, at the beggining of the turn. Cannot be healed or repaired. A player loses the battle if their only remaining units are Objects.',
    },
    Overwatch: {
        icon: ui_icon_trait_overwatch_01,
        name: 'Overwatch',
        description:
            "A unit that has not attacked during its turn immediately attacks when an enemy moves within range during the enemy's turn.",
    },
    Parry: {
        icon: ui_icon_trait_parry_01,
        name: 'Parry',
        description: 'This unit reduces incoming melee multi-hit attacks by 1 hit, to a minimum of 1.',
    },
    PrioritisedEfficiency: {
        // This trait is the faction trait for the League of Votann
        // ToDo: Add proper icon/name/description when available
        icon: ui_icon_trait_unknown_01,
        name: 'Placeholder: League of Votann faction trait',
        description: 'Placeholder: League of Votann faction trait',
    },
    Psyker: {
        icon: ui_icon_trait_psychic_01,
        name: 'Psyker',
        description:
            'When performing a ranged attack with Psychic Damage, this unit uses Smite and deals of that damage 50% to a random enemy adjacent to the initial target.',
    },
    PutridExplosion: {
        icon: ui_icon_trait_putrid_explosion_01,
        name: 'Putrid Explosion',
        description:
            'This unit explodes when defeated, dealing 25% of its max health as Toxic Damage to all adjacent units except to Death Guard units.',
    },
    RangedSpecialist: {
        // Replaces CloseCombatWeakness
        icon: ui_icon_trait_ranged_specialist_01,
        name: 'Ranged Specialist',
        description:
            'If this unit did not start its turn adjacent to an enemy unit, it deals +33% Damage with ranged attacks.',
    },
    RapidAssault: {
        icon: ui_icon_trait_rapid_assault_01,
        name: 'Rapid Assault',
        description:
            'This unit has +1 Movement until it makes a melee attack. Its first melee attack each battle and all following melee attacks in the same turn deal +25% Damage.',
    },
    Resilient: {
        icon: ui_icon_trait_resilient_01,
        name: 'Resilient',
        description:
            'If this unit is not already at 1 Health and would be defeated, its Health is instead reduced to 1 Health, unless Overkilled.',
    },
    ShadowInTheWarp: {
        icon: ui_icon_trait_shadow_in_the_warp_01,
        name: 'Shadow in the Warp',
        description: 'Enemy Psykers within 2 hexes deal -25% Psychic damage. Does not affect Tyranid Psykers.',
    },
    Steppable: {
        icon: ui_icon_trait_steppable_01,
        name: 'Steppable',
        description: 'Will be destroyed if stepped on directly.',
    },
    Summon: {
        icon: ui_icon_trait_summon_01,
        name: 'Summon',
        description: 'Moves and attacks automatically at the beginning of its turn.',
    },
    SuppressiveFire: {
        icon: ui_icon_trait_supressive_fire_01, // Typo in asset name
        name: 'Suppressive Fire',
        description: 'An enemy hit by this unit becomes Suppressed.',
    },
    Swarm: {
        icon: ui_icon_trait_swarm_01,
        name: 'Swarm',
        description:
            'Attacks with 1 hit per individual member of the swarm. Each incoming hit can deal damage only to one member of the swarm. Does not apply to Blast Damage. Healing this unit only affects one member of the swarm.',
    },
    Synapse: {
        icon: ui_icon_trait_synapse_01,
        name: 'Synapse',
        description:
            'Friendly units within 2 hexes of this unit with the Instinctive Behaviour trait may behave as normal. They also ignore their Battle Fatigue trait if they have it.',
    },
    TeleportStrike: {
        icon: ui_icon_trait_teleport_strike_01,
        name: 'Deep Strike',
        description:
            'This unit starts the battle in Deep Strike.\n\n Units in Deep Strike can move to any free hex on the battlefield that is not adjacent to an enemy, or they can move normally from their current position. They cannot be targeted or damaged until they have taken an action or ended their turn',
    },
    TerminatorArmour: {
        icon: ui_icon_trait_terminator_amour_01, // Typo in asset name
        name: 'Terminator Armour',
        description:
            'The first Hit each turn against this character deals -75% Damage. Hits dealing Psychic Damage or Direct Damage are excluded.',
    },
    Terrifying: {
        icon: ui_icon_trait_terrifying_01,
        name: 'Terrifying',
        description: 'Takes -30% damage from Melee attacks.',
    },
    ThrillSeekers: {
        icon: ui_icon_trait_thrill_seekers_01,
        name: 'Thrill Seekers',
        description:
            'Each turn, when this unit takes Damage or targets an enemy with full Health, it becomes Thrilled for 1 round. While Thrilled, its Crit Chance is increased by +15% and if it defeats an enemy with a Crit, that enemy is Always Overkilled.',
    },
    TwoManTeam: {
        icon: ui_icon_trait_2_man_team_01,
        name: '2-Man Team',
        description:
            'Takes a maximum of 50% of its max health from a single hit. Does not apply to Blast Damage. Once below 50% of its max Health, cannot be healed above 50% again.',
    },
    Unstoppable: {
        icon: ui_icon_trait_mounted_01, // Used to be called 'Mounted'; trait key changed but asset name stayed
        name: 'Unstoppable',
        description: 'Movement is not blocked by special hexes.',
    },
    Vehicle: {
        icon: ui_icon_trait_vehicle_01,
        name: 'Vehicle',
        description:
            'Movement is not blocked by special hexes. Does not benefit from Tall Grass. Cannot end its movement on a Trench, but can pass over it.',
    },
    WeaverOfFate: {
        icon: ui_icon_trait_weavers_of_fate_01,
        name: 'Weaver of Fate',
        description:
            'In any turn where 3 or more enemy units have taken Psychic Damage, this unit will deal the maximum possible Damage with its attacks and abilities on that turn.',
    },
};

export const isValidTraitKey = (key: string): key is TraitKey => key in TRAIT_MAP;
