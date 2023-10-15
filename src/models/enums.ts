export enum Alliance {
    Chaos = 'Chaos',
    Imperial = 'Imperial',
    Xenos = 'Xenos',
}

export enum Faction {
    Ultramarines = 'Ultramarines',
    Black_Legion = 'Black Legion',
    Orks = 'Orks',
    ADEPTA_SORORITAS = 'Adepta Sororitas',
    Necrons = 'Necrons',
    Astra_militarum = 'Astra Militarum',
    Death_Guard = 'Death guard',
    Black_Templars = 'Black Templars',
    Aeldari = 'Aeldari',
    Space_Wolves = 'Space Wolves',
    T_Au = "T'au Empire",
    Dark_Angels = 'Dark Angels',
    Thousand_Sons = 'Thousand Sons',
    Tyranids = 'Tyranids',
}

export enum RarityString {
    Common = 'Common',
    Epic = 'Epic',
    Legendary = 'Legendary',
    Rare = 'Rare',
    Uncommon = 'Uncommon',
}

export enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
}

export enum RarityStars {
    OneStar,
    TwoStars,
    ThreeStarts,
    FourStarts,
    FiveStarts,
    RedOneStar,
    RedTwoStarts,
    RedThreeStarts,
    RedFourStarts,
    RedFiveStarts,
    DiamondStar,
}

export enum Equipment {
    Crit = 'Crit',
    Block = 'Block',
    CritBooster = 'Crit Booster',
    BlockBooster = 'Block Booster',
    Defensive = 'Defensive',
}

export enum Trait {
    Psyker = 'Psyker',
    Overwatch = 'Overwatch',
    HeavyWeapon = 'Heavy Weapon',
    Infiltrate = 'Infiltrate',
    Flying = 'Flying',
    MKXGravis = 'MK X Gravis',
    Healer = 'Healer',
    FinalVengeance = 'Final Vengeance',
    LetTheGalaxyBurn = 'Let the Galaxy Burn',
    DeepStrike = 'Deep Strike',
    TerminatorArmour = 'Terminator Armour',
    Resilient = 'Resilient',
    BeastSnagga = 'Beast Snagga',
    Mechanic = 'Mechanic',
    Mechanical = 'Mechanical',
    Explodes = 'Explodes',
    Dakka = 'Dakka',
    Mounted = 'Mounted',
    ActOfFaith = 'Act of Faith',
    LivingMetal = 'Living Metal',
    IndirectFire = 'Indirect Fire',
    ContagionsOfNurgle = 'Contagions of Nurgle',
    PutridExplosion = 'Putrid Explosion',
    Parry = 'Parry',
    Terrifying = 'Terrifying',
    Unstoppable = 'Unstoppable',
    CloseCombatWeakness = 'Close Combat Weakness',
    Camouflage = 'Camouflage',
    WeaverOfFates = 'Weaver of Fates',
    BigTarget = 'Big Target',
    ShadowInTheWarp = 'Shadow in the Warp',
    Synapse = 'Synapse',
    SuppressiveFire = 'Suppressive Fire',
    CrushingStrike = 'Crushing Strike',
}

export enum DamageType {
    Physical = 'Physical',
    Psychic = 'Psychic',
    Bolter = 'Bolter',
    Piercing = 'Piercing',
    Power = 'Power',
    HeavyRound = 'Heavy Round',
    Chain = 'Chain',
    Projectile = 'Projectile',
    Flame = 'Flame',
    Molecular = 'Molecular',
    Particle = 'Particle',
    Plasma = 'Plasma',
    Energy = 'Energy',
    Las = 'Las',
    Blast = 'Blast',
    Direct = 'Direct',
    Pulse = 'Pulse',
    Melta = 'Melta',
}

export enum Rank {
    Undefined,
    Stone1,
    Stone2,
    Stone3,
    Iron1,
    Iron2,
    Iron3,
    Bronze1,
    Bronze2,
    Bronze3,
    Silver1,
    Silver2,
    Silver3,
    Gold1,
    Gold2,
    Gold3,
    Diamond1,
    Diamond2,
    Diamond3,
}

export enum LegendaryEvents {
    None = 0,
    JainZar = 1 << 0,
    AunShi = 1 << 1,
    ShadowSun = 1 << 2,
}

export enum LegendaryEventEnum {
    JainZar = 1,
    AunShi = 2,
    Shadowsun = 4,
    Ragnar = 5,
}

export enum PersonalGoalType {
    None = 0,
    UpgradeRank = 1,
    Ascend = 2,
    Unlock = 3,
}

export enum CharacterBias {
    NeverRecommend = -1,
    None = 0,
    AlwaysRecommend = 1,
}
