import React from 'react';
import { ICampaignBattleComposed } from 'src/models/interfaces';
import { CampaignImage } from 'src/v2/components/images/campaign-image';

interface Props {
    location: ICampaignBattleComposed;
    unlocked: boolean;
    short?: boolean;
}

export const CampaignLocation: React.FC<Props> = ({ location, unlocked, short = false }) => {
    return (
        <div
            className="flex-box gap5"
            style={{
                opacity: unlocked ? 1 : 0.5,
            }}>
            <CampaignImage campaign={location.campaign} size={30} />
            {short ? (
                <span className="bold">{location.nodeNumber}</span>
            ) : (
                <div className="flex-box column start">
                    <span>
                        Battle <span className="bold">{location.nodeNumber}</span>
                    </span>
                    <span style={{ fontSize: 12 }}>{location.campaign}</span>
                </div>
            )}
        </div>
    );
};
