import React from 'react';
import { CampaignImage } from 'src/v2/components/images/campaign-image';
import { IItemRaidLocation } from 'src/v2/features/goals/goals.models';

interface Props {
    location: IItemRaidLocation;
}

export const RaidItemView: React.FC<Props> = ({ location }) => {
    return (
        <div className="flex-box gap5">
            <CampaignImage campaign={location.campaign} size={30} />
            <div className="flex-box column start">
                <span>
                    Battle <span className="bold">{location.nodeNumber}</span>
                </span>
                <span style={{ fontSize: 12 }}>{location.campaign}</span>
            </div>
        </div>
    );
};
