import React, { useMemo } from 'react';

import { CampaignImage } from './campaign.icon';
import { Campaign } from './enums';
import { ICampaignBattleComposed } from './model';

interface Props {
    location: ICampaignBattleComposed;
    unlocked: boolean;
    short?: boolean;
}

export const CampaignLocation: React.FC<Props> = ({ location, unlocked, short = false }) => {
    // Campaigns events has optional "Challenge" nodes 3B, 13B and 25B
    // this function converts linear progression to proper labels
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
            Campaign.DASC,
            Campaign.DAEC,
            Campaign.BASC,
            Campaign.BAEC,
        ];
        if (challengeCampaigns.includes(location.campaign)) {
            return location.nodeNumber + 'B';
        }
        return location.nodeNumber;
    }, [location]);

    return location === undefined ? (
        <span>undefined</span>
    ) : (
        <div
            className="flex items-center gap-0.5"
            style={{
                opacity: unlocked ? 1 : 0.5,
            }}>
            <CampaignImage campaign={location.campaign} size={30} />
            {short ? (
                <span className="font-bold text-(--soft-fg)">{locationNumber}</span>
            ) : (
                <div className="flex flex-col items-start">
                    <span>
                        Battle <span className="font-bold text-(--soft-fg)">{locationNumber}</span>
                    </span>
                    <span className="text-xs">{location.campaign}</span>
                </div>
            )}
        </div>
    );
};
