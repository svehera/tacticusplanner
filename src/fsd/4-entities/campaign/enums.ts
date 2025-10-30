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
    TAS = "T'au Empire Standard",
    TASC = "T'au Empire Standard Challenge",
    TAE = "T'au Empire Extremis",
    TAEC = "T'au Empire Extremis Challenge",
    DGS = 'Death Guard Standard',
    DGSC = 'Death Guard Standard Challenge',
    DGE = 'Death Guard Extremis',
    DGEC = 'Death Guard Extremis Challenge',
    Onslaught = 'Onslaught',
}

/**
 * Enum representing the types of campaign releases.
 */
export enum CampaignReleaseType {
    /**
     * Standard campaigns released before January 23, 2025.
     * Examples include Indomitus, Fall of Cadia, Octarius, and Saim-Hann.
     */
    standard = 0,

    /**
     * Campaign Events introduced as "Campaigns 2.0," offering event-based gameplay.
     * Example: Adeptus Mechanicus.
     */
    event = 1,
}

/**
 * Enum representing the grouping or storyline a campaign is associated with.
 */
export enum CampaignGroupType {
    /**
     * Campaigns from the Indomitus storyline.
     */
    indomitus = 'Indomitus',

    /**
     * Campaigns from the Fall of Cadia storyline.
     */
    fallOfCadia = 'Fall of Cadia',

    /**
     * Campaigns from the Octarius storyline.
     */
    octarius = 'Octarius',

    /**
     * Campaigns from the Saim-Hann storyline.
     */
    saimHann = 'Saim-Hann',

    /**
     * Campaign Event: Adeptus Mechanicus storyline.
     */
    adMechCE = 'AdMech',

    /**
     * Campaign Event: Death Guard storyline.
     */
    deathGuardCE = 'Death Guard',

    /**
     * Campaign Event: Tyranids storyline.
     */
    tyranidCE = 'Tyranids',

    /**
     * Campaign Event: T'au Empire storyline.
     */
    tauCE = "T'au Empire",
}

/**
 * Enum representing the difficulty levels available in campaigns.
 */
export enum CampaignDifficulty {
    /**
     * Standard difficulty for regular campaigns.
     */
    standard = 0,

    /**
     * Mirror difficulty, typically offering mirrored or reversed challenges.
     */
    mirror = 1,

    /**
     * Elite difficulty for advanced players.
     */
    elite = 2,

    /**
     * Standard mode in Campaign Events (e.g., Common-Rare battles from 1-30).
     */
    eventStandard = 3,

    /**
     * Extremis mode in Campaign Events (e.g., Epic-Legendary battles from 1-30).
     */
    eventExtremis = 4,

    /**
     * Challenge battle nodes in Campaign Events, including battles like 3B, 13B, and 25B (x2).
     * Covers Common-Legendary difficulties.
     */
    eventChallenge = 5,
}
