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
