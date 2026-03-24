import { Tooltip } from '@mui/material';
import React, { useMemo } from 'react';

import { CampaignImage } from './campaign.icon';
import { Campaign, campaignDisplayNames } from './enums';
import { ICampaignBattleComposed } from './model';

interface Props {
    location: ICampaignBattleComposed;
    unlocked: boolean;
}

export const CompactCampaignLocation: React.FC<Props> = ({ location, unlocked }) => {
    const locationNumber = useMemo(() => {
        if (location === undefined) return 'undefined';
        const challengeCampaigns = [
            Campaign.AMSC,
            Campaign.AMEC,
            Campaign.DGSC,
            Campaign.DGEC,
            Campaign.TSC,
            Campaign.TEC,
            Campaign.TASC,
            Campaign.TAEC,
            Campaign.ASSC,
            Campaign.ASEC,
        ];
        if (challengeCampaigns.includes(location.campaign)) {
            return location.nodeNumber + 'B';
        }
        return location.nodeNumber;
    }, []);

    const campaignShort = campaignDisplayNames[location.campaign] ?? location.campaign;

    return location === undefined ? (
        <span>undefined</span>
    ) : (
        <Tooltip title={location.campaign} placement="top">
            <div
                className="border-muted-fg/40 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5"
                style={{
                    opacity: unlocked ? 1 : 0.5,
                }}>
                <CampaignImage campaign={location.campaign} size={18} showTooltip={false} />
                <span className="text-secondary-fg text-[10px] leading-none">
                    {campaignShort} {locationNumber}
                </span>
            </div>
        </Tooltip>
    );
};
