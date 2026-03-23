import { Info } from '@mui/icons-material';
import React, { useMemo } from 'react';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { CampaignImage } from './campaign.icon';
import { Campaign } from './enums';
import { ICampaignBattleComposed } from './model';

interface Props {
    location: ICampaignBattleComposed;
    unlocked: boolean;
    short?: boolean;
    showBattleInfo?: boolean;
}

export const CampaignLocation: React.FC<Props> = ({ location, unlocked, short = false, showBattleInfo = false }) => {
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
        ];
        if (challengeCampaigns.includes(location.campaign)) {
            return location.nodeNumber + 'B';
        }
        return location.nodeNumber;
    }, [location]);

    if (location === undefined) {
        return <span>undefined</span>;
    }

    return (
        <div
            className="flex-box gap-0.5"
            style={{
                opacity: unlocked ? 1 : 0.5,
            }}>
            <CampaignImage campaign={location.campaign} size={30} />

            <div className="flex-box column start">
                <div className="flex-box row items-center">
                    {short ? (
                        <span className="font-bold text-gray-400">{locationNumber}</span>
                    ) : (
                        <span className="text-xs">{location.campaign}</span>
                    )}

                    {/* Render the info icon if enabled, regardless of short/long mode */}
                    {showBattleInfo && (
                        <AccessibleTooltip
                            title={
                                <>
                                    <div>
                                        Battle: <b>{location.nodeNumber ?? 0}</b>
                                    </div>
                                    <div>
                                        Enemies: <b>{location.enemiesTotal ?? 0}</b>
                                    </div>
                                    <div>
                                        Factions:{' '}
                                        <b>
                                            {Array.isArray(location.enemiesFactions) &&
                                            location.enemiesFactions.length > 0
                                                ? location.enemiesFactions.join(', ')
                                                : 'N/A'}
                                        </b>
                                    </div>
                                </>
                            }>
                            <Info
                                color="primary"
                                fontSize="small"
                                sx={{
                                    cursor: 'help',
                                    ml: 0.5,
                                    width: 14,
                                    height: 14,
                                }}
                            />
                        </AccessibleTooltip>
                    )}
                </div>
            </div>
        </div>
    );
};
