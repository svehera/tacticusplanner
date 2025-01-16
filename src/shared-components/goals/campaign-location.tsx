﻿import React, { useMemo } from 'react';
import { ICampaignBattleComposed } from 'src/models/interfaces';
import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { Campaign } from 'src/models/enums';

interface Props {
    location: ICampaignBattleComposed;
    unlocked: boolean;
    short?: boolean;
}

export const CampaignLocation: React.FC<Props> = ({ location, unlocked, short = false }) => {
    const locationNumber = useMemo(() => {
        const challengeCampaigns = [Campaign.AMSC, Campaign.AMEC];
        if (challengeCampaigns.includes(location.campaign)) {
            switch (location.nodeNumber) {
                case 1:
                    return '3B';
                case 2:
                    return '13B';
                case 3:
                    return '25B';
            }
        }
        return location.nodeNumber;
    }, []);

    return (
        <div
            className="flex-box gap5"
            style={{
                opacity: unlocked ? 1 : 0.5,
            }}>
            <CampaignImage campaign={location.campaign} size={30} />
            {short ? (
                <span className="bold">{locationNumber}</span>
            ) : (
                <div className="flex-box column start">
                    <span>
                        Battle <span className="bold">{locationNumber}</span>
                    </span>
                    <span style={{ fontSize: 12 }}>{location.campaign}</span>
                </div>
            )}
        </div>
    );
};
