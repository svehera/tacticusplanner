import { IRaidLocation } from 'src/models/interfaces';
import React from 'react';
import { CampaignImage } from 'src/v2/components/images/campaign-image';

interface Props {
    location: IRaidLocation;
}

export const RaidItemView: React.FC<Props> = ({ location }) => {
    return (
        <div className="flex-box gap5">
            <CampaignImage campaign={location.campaign} size={30} />
            <div className="flex-box column start">
                <span>
                    <span className="italic">({location.raidsCount}x)</span> Battle{' '}
                    <span className="bold">{location.battleNumber}</span>
                </span>
                <span style={{ fontSize: 12 }}>{location.campaign}</span>
            </div>
        </div>
    );
};
