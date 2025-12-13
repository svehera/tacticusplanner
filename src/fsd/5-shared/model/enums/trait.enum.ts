export enum Trait {
    ActOfFaith = 'Act of Faith',
    Ambush = 'Ambush',
    BattleFatigue = 'Battle Fatigue',
    BeastSnagga = 'Beast Slayer',
    BigTarget = 'Big Target',
    BlessingsOfKhorne = 'Blessings of Khorne',
    Camouflage = 'Camouflage',
    CloseCombatWeakness = 'Close Combat Weakness',
    ContagionsOfNurgle = 'Contagions of Nurgle',
    CrushingStrike = 'Crushing Strike',
    Daemon = 'Daemon',
    Dakka = 'Dakka',
    TeleportStrike = 'Deep Strike',
    Diminutive = 'Diminutive',
    Emplacement = 'Emplacement',
    Explodes = 'Explodes',
    FinalJustice = 'Final Vengeance',
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
    MartialKatah = "Martial Ka'tah",
    Mechanic = 'Mechanic',
    Mechanical = 'Mechanical',
    MkXGravis = 'MK X Gravis',
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
    ThrillSeekers = 'Thrill Seekers',
    TwoManTeam = 'Two-Man Team',
    Unstoppable = 'Unstoppable',
    Vehicle = 'Vehicle',
    WeaverOfFate = 'Weaver of Fates',
}

const labelToTraitStringMap: Record<string, string> = Object.entries(Trait).reduce(
    (acc, [key, value]) => {
        acc[value] = key;
        return acc;
    },
    {} as Record<string, string>
);

export function getTraitStringFromLabel(label: string): string | undefined {
    return labelToTraitStringMap[label];
}

export function getLabelFromTraitString(traitString: string) {
    return Trait[traitString as keyof typeof Trait];
}
