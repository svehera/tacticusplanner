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
    BloodAngels = 'Blood Angels',
    GenestealerCults = 'Genestealer Cults',
    Unknown = 'Unknown',
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

export enum DamageType {
    Bio = 'Bio',
    Blast = 'Blast',
    Bolter = 'Bolter',
    Chain = 'Chain',
    Direct = 'Direct',
    Energy = 'Energy',
    Eviscerate = 'Eviscerate',
    Flame = 'Flame',
    HeavyRound = 'Heavy Round',
    Las = 'Las',
    Melta = 'Melta',
    Molecular = 'Molecular',
    Particle = 'Particle',
    Physical = 'Physical',
    Piercing = 'Piercing',
    Plasma = 'Plasma',
    Power = 'Power',
    Projectile = 'Projectile',
    Psychic = 'Psychic',
    Pulse = 'Pulse',
    Toxic = 'Toxic',
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
    Kharn = 7,
    Mephiston = 8,
    Patermine = 9,
    Dante = 10,
    Unknown = 11,
}

export enum PersonalGoalType {
    None = 0,
    UpgradeRank = 1,
    Ascend = 2,
    Unlock = 3,
    MowAbilities = 4,
    CharacterAbilities = 5,
}

export enum CampaignsLocationsUsage {
    None = 0,
    BestTime = 1,
    LeastEnergy = 2,
}

export enum CharacterBias {
    recommendLast = -1,
    None = 0,
    recommendFirst = 1,
}

export enum CampaignType {
    SuperEarly = 'SuperEarly',
    Early = 'Early',
    EarlyChars = 'EarlyChars',
    EarlyMirrorChars = 'EarlyMirrorChars',
    Normal = 'Normal',
    Mirror = 'Mirror',
    Elite = 'Elite',
    Onslaught = 'Onslaught',
    Extremis = 'Extremis',
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
    AMS = 'Adeptus Mechanicus Standard',
    AMSC = 'Adeptus Mechanicus Standard Challenge',
    AME = 'Adeptus Mechanicus Extremis',
    AMEC = 'Adeptus Mechanicus Extremis Challenge',
    TS = 'Tyranids Standard',
    TSC = 'Tyranids Standard Challenge',
    TE = 'Tyranids Extremis',
    TEC = 'Tyranids Extremis Challenge',
    Onslaught = 'Onslaught',
}

export enum DailyRaidsStrategy {
    leastEnergy,
    leastTime,
    allLocations,
    custom,
}

export enum UserRole {
    user = 0,
    moderator = 1,
    admin = 2,
}

export enum ProgressState {
    none = 0,
    completed = 1,
    blocked = 2,
}

export enum LrePointsCategoryId {
    killScore = '_killPoints',
    defeatAll = '_defeatAll',
    highScore = '_highScore',
}

/** The class of equipment. More for human consumption. */
export enum EquipmentClass {
    BoltPistol = 'Bolt Pistol',
    BoneSword = 'Bone Sword',
    CeremonialKnife = 'Ceremonial Knife',
    CombatKnife = 'Combat Knife',
    CorruptedBoltPistol = 'Corrupted Bolt Pistol',
    CorruptedFragGrenades = 'Corrupted Frag Grenades',
    DisruptionFields = 'Disruption Fields',
    Exoskeleton = 'Exoskeleton',
    ForceField = 'Force Field',
    ForcefieldAmplifier = 'Forcefield Amplifier',
    FragGrenades = 'Frag Grenades',
    FusionCharges = 'Fusion Charges',
    PlatedGreaves = 'Plated Greaves',
    HeavenfallBlade = 'Heavenfall Blade',
    HeirloomBoltPistol = 'Heirloom Bolt Pistol',
    IllusionImagafier = 'Illusion Imagafier',
    IronHalo = 'Iron Halo',
    LashWhip = 'Lash-Whip',
    Mantle = 'Mantle',
    Pauldron = 'Pauldron',
    NanocrystallinePlating = 'Nanocrystalline Plating',
    ParticleCasters = 'Particle Casters',
    PulsePistol = 'Pulse Pistol',
    QuantumShield = 'Quantum Shield',
    RefractorField = 'Refractor Field',
    SavageIcon = 'Savage Icon',
    ShurikenPistol = 'Shuriken Pistol',
    Slugga = 'Slugga',
    SpikedPauldron = 'Spiked Pauldron',
    Stikkbomz = 'Stikkbomz',
    VoidBlade = 'Void Blade',
}
