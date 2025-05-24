export enum Difficulty {
    None,
    Easy,
    Normal,
    Hard,
    VeryHard,
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

// Re-export from FSD entities
export { Campaign, CampaignType } from '@/fsd/4-entities/campaign';
