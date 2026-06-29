/**
 * Global trait variable values provided by game data.
 * Keys are the canonical global names; values are the resolved constants.
 */
export const TRAIT_GLOBAL_VARIABLES = {
    livingMetalHp: 10,
    heavyWeaponExtraDmg: 25,
    damagedMachineDestroyChanceIncrease: 50,
    psykerExtraDmg: 50,
    emplacementMeleeDmgModifier: -50,
    emplacementRangedDmgModifier: 50,
    deathToTheFalseEmperorExtraHitChance: 33,
    actOfFaithExtraCritChance: 10,
    actOfFaithExtraCritDmgPct: 25,
    battleFatigueChance: 10,
    battleFatigueChance_2: 40,
    terrifyingDefensePct: -30,
    daemonBlockChance: 25,
    daemonBlockDamagePercentage: 50,
    shadowInTheWarpDmgModifier: -25,
    shadowInTheWarpRange: 2,
    putridExplosionDmgPct: 25,
    putridExplosionFactionId: 'DeathGuard',
    putridExplosionDamageProfile: 'Toxic',
    contagionsOfNurgleArmorOneAura: -20,
    contagionsOfNurgleArmorTwoOrMoreAuras: -40,
    parryHitReduction: 1,
    diminutiveHitReduction: 1,
    dakkaExtraHits: 2,
    beastSnaggaDmgBonus: 20,
    beastSnaggaBlockChance: 10,
    beastSnaggaDmgAsMaxHpPct: 20,
    beastSlayerExtraDmgPct: 20,
    beastSlayerBlockChance: 10,
    beastSlayerBlockAsMaxArmorPct: 100,
    closeCombatWeaknessMeleeDmgPctReduction: -50,
    closeCombatWeaknessRangeDmgPctReduction: -25,
    camouflageHitReduction_1: 1,
    camouflageHitReduction_2: 2,
    camouflageHitReduction_3: 3,
    terminatorArmourDmgReduction: -75,
    terminatorArmourExcludedDmgProfiles: 'Psychic,DirectDamage',
    bossAdjutantDmgReductionPct: 66,
    bossAdjutantDmgPct: 1,
    crushingStrikeExtraDmgPct: 50,
    rapidAssaultExtraDmgPct: 25,
    blessingsOfKhorneExtraDmgPct: 3,
    blessingsOfKhorneDmgPctReduction: 8,
    blessingsOfKhorneMaxDefeatedUnits: 8,
    getStuckInChance: 30,
    getStuckInChance_2: 100,
    ambushUnitToSpawn: 'genesSmnDecoy',
    martialKatahDmgReductionPct: 20,
    martialKatahExtraDmgPct: 100,
    thrillSeekersNrOfRounds: 1,
    thrillSeekersExtraCritChance: 15,
    LetTheGalaxyBurnChancePct: 33,
    prioritisedEfficiencyExtraDmgPct: 25,
    prioritisedEfficiencyDmgReductionPct: 33,
    rangedSpecialistDmgPct: 33,
} as const;

type GlobalKey = keyof typeof TRAIT_GLOBAL_VARIABLES;

/**
 * Maps each trait's description variable placeholders ({[varName]}) to the
 * corresponding key in TRAIT_GLOBAL_VARIABLES.
 *
 * Mapping: TRAIT_VARIABLE_MAP[traitId][descriptionVarName] = globalKey
 *
 */
export const TRAIT_VARIABLE_MAP: Record<string, Record<string, GlobalKey>> = {
    ActOfFaith: {
        extraCritChance: 'actOfFaithExtraCritChance',
        extraCritDmgPct: 'actOfFaithExtraCritDmgPct',
    },
    BattleFatigue: {
        chance: 'battleFatigueChance',
        chance_2: 'battleFatigueChance_2',
    },
    BeastSlayer: {
        extraDmgPct: 'beastSlayerExtraDmgPct',
        blockChance: 'beastSlayerBlockChance',
    },
    BeastSnagga: {
        extraDmgPct: 'beastSnaggaDmgBonus',
        blockChance: 'beastSnaggaBlockChance',
        blockDmgPct: 'beastSnaggaDmgAsMaxHpPct',
    },
    BlessingsOfKhorne: {
        extraDmgPct: 'blessingsOfKhorneExtraDmgPct',
        dmgPctReduction: 'blessingsOfKhorneDmgPctReduction',
        nrOfHeroes: 'blessingsOfKhorneMaxDefeatedUnits',
    },
    BossAdjutant: {
        damagePctReduction: 'bossAdjutantDmgReductionPct',
        damagePct: 'bossAdjutantDmgPct',
    },
    CloseCombatWeakness: {
        dmgPctReduction: 'closeCombatWeaknessMeleeDmgPctReduction',
        dmgPctReduction_2: 'closeCombatWeaknessRangeDmgPctReduction',
    },
    ContagionsOfNurgle: {
        armorReduction: 'contagionsOfNurgleArmorOneAura',
        armorReduction2: 'contagionsOfNurgleArmorTwoOrMoreAuras',
    },
    CrushingStrike: {
        extraDmgPct: 'crushingStrikeExtraDmgPct',
    },
    Daemon: {
        blockChance: 'daemonBlockChance',
        blockDmgPct: 'daemonBlockDamagePercentage',
    },
    Dakka: {
        extraHit: 'dakkaExtraHits',
    },
    Diminutive: {
        hitsReduction: 'diminutiveHitReduction',
    },
    Emplacement: {
        damageModifier: 'emplacementMeleeDmgModifier',
        damageModifier_2: 'emplacementRangedDmgModifier',
    },
    GetStuckIn: {
        chance: 'getStuckInChance',
        chance_2: 'getStuckInChance_2',
    },
    HeavyWeapon: {
        extraDmgPct: 'heavyWeaponExtraDmg',
    },
    LetTheGalaxyBurn: {
        chance: 'LetTheGalaxyBurnChancePct',
    },
    LivingMetal: {
        hpPct: 'livingMetalHp',
    },
    MartialKatah: {
        dmgReductionPct: 'martialKatahDmgReductionPct',
        extraDmgPct: 'martialKatahExtraDmgPct',
    },
    Parry: {
        hitsReduction: 'parryHitReduction',
    },
    PrioritisedEfficiency: {
        extraDmgPct: 'prioritisedEfficiencyExtraDmgPct',
        dmgReductionPct: 'prioritisedEfficiencyDmgReductionPct',
    },
    Psyker: {
        extraDmgPct: 'psykerExtraDmg',
    },
    PutridExplosion: {
        extraDmgPct: 'putridExplosionDmgPct',
    },
    RangedSpecialist: {
        extraDmgPct: 'rangedSpecialistDmgPct',
    },
    RapidAssault: {
        extraDmgPct: 'rapidAssaultExtraDmgPct',
    },
    ShadowInTheWarp: {
        range: 'shadowInTheWarpRange',
        dmgPct: 'shadowInTheWarpDmgModifier',
    },
    TerminatorArmour: {
        dmgPctReduction: 'terminatorArmourDmgReduction',
    },
    Terrifying: {
        defensePct: 'terrifyingDefensePct',
    },
    ThrillSeekers: {
        nrOfRounds: 'thrillSeekersNrOfRounds',
        extraCritChance: 'thrillSeekersExtraCritChance',
    },
};

/**
 * Returns resolved variables for a trait, ready for use with AbilityText.
 * Each variable is wrapped in a single-element array (trait values don't level up).
 */
export function getTraitVariables(traitId: string): Record<string, (string | number)[]> {
    const map = TRAIT_VARIABLE_MAP[traitId];
    if (!map) return {};
    return Object.fromEntries(
        Object.entries(map).map(([variableName, globalKey]) => [variableName, [TRAIT_GLOBAL_VARIABLES[globalKey]]])
    );
}
