import { CampaignDifficulty } from '@/fsd/4-entities/campaign';

export const getMaxNodes = (difficulty: CampaignDifficulty): number => {
    switch (difficulty) {
        case CampaignDifficulty.standard:
        case CampaignDifficulty.mirror: {
            return 75;
        }
        case CampaignDifficulty.elite: {
            return 40;
        }
        case CampaignDifficulty.eventStandard:
        case CampaignDifficulty.eventExtremis: {
            return 30;
        }
        case CampaignDifficulty.eventChallenge: {
            return 3;
        }
        default: {
            return 0;
        }
    }
};
