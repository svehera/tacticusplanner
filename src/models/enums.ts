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
    AdeptusMechanicus = 'Adeptus Mechanicus',
    WorldEaters = 'World Eaters',
}

export enum RarityString {
    Common = 'Common',
    Uncommon = 'Uncommon',
    Rare = 'Rare',
    Epic = 'Epic',
    Legendary = 'Legendary',
}

export enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
}

export enum CharacterReleaseRarity {
    Common = 1,
    Uncommon,
    Rare,
    Epic,
    LegendaryOld,
    Legendary,
}

export enum RarityStars {
    None,
    OneStar,
    TwoStars,
    ThreeStars,
    FourStars,
    FiveStars,
    RedOneStar,
    RedTwoStars,
    RedThreeStars,
    RedFourStars,
    RedFiveStars,
    BlueStar,
}

export enum Difficulty {
    None,
    Easy,
    Normal,
    Hard,
    VeryHard,
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
    BeastSlayer = 'Beast Slayer',
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
    RapidAssault = 'Rapid Assault',
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
    Locked,
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
    Vitruvius = 6,
}

export enum PersonalGoalType {
    None = 0,
    UpgradeRank = 1,
    Ascend = 2,
    Unlock = 3,
}

export enum CampaignsLocationsUsage {
    None = 0,
    BestTime = 1,
    LeastEnergy = 2,
}

export enum CharacterBias {
    NeverRecommend = -1,
    None = 0,
    AlwaysRecommend = 1,
}

export enum CampaignType {
    Early = 'Early',
    EarlyChars = 'EarlyChars',
    EarlyMirrorChars = 'EarlyMirrorChars',
    Normal = 'Normal',
    Mirror = 'Mirror',
    Elite = 'Elite',
    Onslaught = 'Onslaught',
}

export enum Campaign {
    I = 'Indomitus',
    IE = 'Indomitus Elite',
    IM = 'Indomitus Mirror',
    IME = 'Indomitus Mirror Elite',
    FoC = 'Fall of Cadia',
    FoCE = 'Fall of Cadia Elite',
    FoCM = 'Fall of Cadia Mirror',
    FoCME = 'Fall of Cadia Mirror Elite',
    O = 'Octarius',
    OE = 'Octarius Elite',
    OM = 'Octarius Mirror',
    OME = 'Octarius Mirror Elite',
    SH = 'Saim-Hann',
    SHE = 'Saim-Hann Elite',
    SHM = 'Saim-Hann Mirror',
    SHME = 'Saim-Hann Mirror Elite',
    Onslaught = 'Onslaught',
}
