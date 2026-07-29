import { factionLookup } from '@/fsd/5-shared/lib';
import { FactionId } from '@/fsd/5-shared/model';

import { Campaign, CampaignsService } from '@/fsd/4-entities/campaign';

export interface ICampaignStorylineOption {
    value: string;
    label: string;
}

// Campaign storylines usable as Campaign sub-modes. Mirror runs are treated as
// separate storylines; Elite is a difficulty, not a separate storyline; the
// Campaign Events (AdMech onwards) have no mirror. Values are stable string
// keys persisted on the team, so do not rename them.
export const campaignStorylineOptions: ICampaignStorylineOption[] = [
    { value: 'indomitus', label: 'Indomitus' },
    { value: 'indomitusMirror', label: 'Indomitus Mirror' },
    { value: 'fallOfCadia', label: 'Fall of Cadia' },
    { value: 'fallOfCadiaMirror', label: 'Fall of Cadia Mirror' },
    { value: 'octarius', label: 'Octarius' },
    { value: 'octariusMirror', label: 'Octarius Mirror' },
    { value: 'saimHann', label: 'Saim-Hann' },
    { value: 'saimHannMirror', label: 'Saim-Hann Mirror' },
    { value: 'adMech', label: 'AdMech' },
    { value: 'deathGuard', label: 'Death Guard' },
    { value: 'tyranids', label: 'Tyranids' },
    { value: 'tau', label: "T'au Empire" },
    { value: 'sisters', label: 'Adepta Sororitas' },
    { value: 'darkAngels', label: 'Dark Angels' },
];

export const campaignStorylineLabel = (value: string): string =>
    campaignStorylineOptions.find(option => option.value === value)?.label ?? value;

// A representative Campaign for each storyline, used to derive the usable factions.
// Mirror runs map to their mirror campaign (allies/enemies are swapped); Elite is a
// difficulty within a storyline, so any variant of the storyline works here.
const storylineToCampaign: Record<string, Campaign> = {
    indomitus: Campaign.I,
    indomitusMirror: Campaign.IM,
    fallOfCadia: Campaign.FoC,
    fallOfCadiaMirror: Campaign.FoCM,
    octarius: Campaign.O,
    octariusMirror: Campaign.OM,
    saimHann: Campaign.SH,
    saimHannMirror: Campaign.SHM,
    adMech: Campaign.AMS,
    deathGuard: Campaign.DGS,
    tyranids: Campaign.TS,
    tau: Campaign.TAS,
    sisters: Campaign.ASS,
    darkAngels: Campaign.DAS,
};

/**
 * The Campaign whose icon represents a storyline. Every storyline maps to a campaign that
 * has an icon asset, so this doubles as the icon key. Returns undefined when unknown.
 */
export const campaignStorylineIcon = (storyline: string): Campaign | undefined => storylineToCampaign[storyline];

/**
 * A short, human-readable hint of which factions are usable in a storyline, derived
 * from the campaign's allied factions. Standard campaigns allow a whole alliance, so
 * the alliance name is shown instead of every faction. Returns undefined when unknown.
 */
export const campaignStorylineUsableFactions = (storyline: string): string | undefined => {
    const campaign = storylineToCampaign[storyline];
    if (!campaign) {
        return undefined;
    }

    const { allies } = CampaignsService.getEnemiesAndAllies(campaign);
    if (allies.factions.length === 0) {
        return undefined;
    }

    const allianceSize = Object.values(factionLookup).filter(faction => faction.alliance === allies.alliance).length;
    if (allies.factions.length >= allianceSize) {
        return `Any ${allies.alliance}`;
    }

    return allies.factions.map((faction: FactionId) => factionLookup[faction].name).join(', ');
};

/**
 * The faction ids usable in a storyline's campaign (its allied factions). Standard
 * campaigns return a whole alliance's factions; Campaign Events return a small set.
 * Returns an empty array when unknown (no filtering should be applied).
 */
export const campaignStorylineUsableFactionIds = (storyline: string): FactionId[] => {
    const campaign = storylineToCampaign[storyline];
    if (!campaign) {
        return [];
    }

    return CampaignsService.getEnemiesAndAllies(campaign).allies.factions;
};

/**
 * The snowprintIds of the three core characters required for a storyline's campaign.
 * Every difficulty/mirror variant of a storyline shares the same core trio. Returns an
 * empty array when unknown.
 */
export const campaignStorylineCoreCharacters = (storyline: string): string[] => {
    const campaign = storylineToCampaign[storyline];
    if (!campaign) {
        return [];
    }

    return CampaignsService.allCampaigns.find(model => model.id === campaign)?.coreCharacters ?? [];
};
