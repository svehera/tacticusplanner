import { CampaignGroupType, campaignsByGroup } from '@/fsd/4-entities/campaign';

export interface CampaignSection {
    label: string;
    campaigns: string[];
}

const OTHER_LABEL = 'Other';

/**
 * Groups the given campaign names by storyline (Indomitus, Fall of Cadia, each campaign event...),
 * keeping the storyline order of `campaignsByGroup`. Campaigns that belong to no storyline
 * (e.g. Onslaught) are collected in a trailing "Other" section.
 */
export function getCampaignSections(available: string[]): CampaignSection[] {
    const availableSet = new Set(available);
    const placed = new Set<string>();
    const sections: CampaignSection[] = [];

    for (const [group, campaigns] of Object.entries(campaignsByGroup)) {
        const inGroup = campaigns.filter(campaign => availableSet.has(campaign));
        if (inGroup.length === 0) continue;
        for (const campaign of inGroup) placed.add(campaign);
        sections.push({ label: group as CampaignGroupType, campaigns: inGroup });
    }

    const others = available.filter(campaign => !placed.has(campaign)).toSorted();
    if (others.length > 0) sections.push({ label: OTHER_LABEL, campaigns: others });

    return sections;
}
