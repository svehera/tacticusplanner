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
        const challengeCampaigns = [
            Campaign.AMSC,
            Campaign.AMEC,
            Campaign.DGSC,
            Campaign.DGEC,
            Campaign.TSC,
            Campaign.TEC,
            Campaign.TASC,
            Campaign.TAEC,
        ];
        if (challengeCampaigns.includes(location.campaign)) {
            return location.nodeNumber + 'B';
        }
        return location.nodeNumber;
    }, []);

    return (
        <div
            className="flex-box gap-0.5"
            style={{
                opacity: unlocked ? 1 : 0.5,
            }}>
            <CampaignImage campaign={location.campaign} size={30} />
            {short ? (
                <span className="font-bold">{locationNumber}</span>
            ) : (
                <div className="flex-box column start">
                    <span>
                        Battle <span className="font-bold">{locationNumber}</span>
                    </span>
                    <span className="text-xs">{location.campaign}</span>
                </div>
            )}
        </div>
    );
};
