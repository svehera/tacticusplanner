export enum Trait {
    ActOfFaith = 'Act of Faith',
    Ambush = 'Ambush',
    BattleFatigue = 'Battle Fatigue',
    BeastSlayer = 'Beast Slayer',
    BigTarget = 'Big Target',
    Camouflage = 'Camouflage',
    CloseCombatWeakness = 'Close Combat Weakness',
    ContagionsOfNurgle = 'Contagions of Nurgle',
    CrushingStrike = 'Crushing Strike',
    Daemon = 'Daemon',
    Dakka = 'Dakka',
    DeepStrike = 'Deep Strike',
    Diminutive = 'Diminutive',
    Emplacement = 'Emplacement',
    Explodes = 'Explodes',
    FinalVengeance = 'Final Vengeance',
    Flying = 'Flying',
    GetStuckIn = 'Get Stuck In',
    Healer = 'Healer',
    HeavyWeapon = 'Heavy Weapon',
    Immune = 'Immune',
    Impervious = 'Impervious',
    IndirectFire = 'Indirect Fire',
    Infiltrate = 'Infiltrate',
    InstinctiveBehaviour = 'Instinctive Behaviour',
    LetTheGalaxyBurn = 'Let the Galaxy Burn',
    LivingMetal = 'Living Metal',
    Mechanic = 'Mechanic',
    Mechanical = 'Mechanical',
    MKXGravis = 'MK X Gravis',
    Mounted = 'Mounted',
    Overwatch = 'Overwatch',
    Parry = 'Parry',
    Psyker = 'Psyker',
    PutridExplosion = 'Putrid Explosion',
    RapidAssault = 'Rapid Assault',
    Resilient = 'Resilient',
    ShadowInTheWarp = 'Shadow in the Warp',
    Summon = 'Summon',
    SuppressiveFire = 'Suppressive Fire',
    Swarm = 'Swarm',
    Synapse = 'Synapse',
    TerminatorArmour = 'Terminator Armour',
    Terrifying = 'Terrifying',
    TwoManTeam = 'Two-Man Team',
    Unstoppable = 'Unstoppable',
    Vehicle = 'Vehicle',
    WeaverOfFates = 'Weaver of Fates',
}

const labelToTraitMap: Record<string, Trait> = Object.entries(Trait).reduce(
    (acc, [key, value]) => {
        acc[value] = Trait[key as keyof typeof Trait];
        return acc;
    },
    {} as Record<string, Trait>
);

export function getTraitFromLabel(label: string): Trait | undefined {
    return labelToTraitMap[label];
}
