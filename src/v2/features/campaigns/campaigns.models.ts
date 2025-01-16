import { CampaignDifficulty, CampaignGroupType, CampaignReleaseType } from './campaigns.enums';
import { Campaign, Faction } from 'src/models/enums';

/**
 * Represents the structure of a campaign with its unique attributes.
 */
export interface ICampaignModel {
    /**
     * Unique identifier for the campaign.
     */
    id: Campaign;

    /**
     * The name of the campaign.
     */
    name: string;

    /**
     * The faction required to beat campaign.
     */
    faction: Faction;

    /**
     * The release type of the campaign, indicating how and when it was made available.
     */
    releaseType: CampaignReleaseType;

    /**
     * The group or storyline that the campaign belongs to (e.g., Indomitus, Octarius).
     */
    groupType: CampaignGroupType;

    /**
     * The difficulty level of the campaign, such as standard, elite, or event-specific modes.
     */
    difficulty: CampaignDifficulty;
}
