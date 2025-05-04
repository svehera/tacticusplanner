export enum CharacterReleaseRarity {
    Common = 1,
    Uncommon,
    Rare,
    Epic,
    LegendaryOld,
    Legendary,
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
