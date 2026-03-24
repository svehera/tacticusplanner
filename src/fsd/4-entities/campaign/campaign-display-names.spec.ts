import { describe, it, expect } from 'vitest';

import { Campaign, campaignDisplayNames } from './enums';

describe('campaignDisplayNames', () => {
    it('should have a display name for every Campaign enum value', () => {
        const allCampaignValues = Object.values(Campaign);

        for (const campaign of allCampaignValues) {
            expect(campaignDisplayNames).toHaveProperty(campaign);
            expect(campaignDisplayNames[campaign]).toBeTruthy();
        }
    });

    it('should not contain entries that are not in the Campaign enum', () => {
        const allCampaignValues = new Set(Object.values(Campaign));

        for (const key of Object.keys(campaignDisplayNames)) {
            expect(allCampaignValues.has(key as Campaign)).toBe(true);
        }
    });

    it('should map Indomitus to "Ind" instead of single letter "I"', () => {
        expect(campaignDisplayNames[Campaign.I]).toBe('Ind');
    });

    it('should map Octarius to "Oct" instead of single letter "O"', () => {
        expect(campaignDisplayNames[Campaign.O]).toBe('Oct');
    });
});
