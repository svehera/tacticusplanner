import React from 'react';

import { IEventMissions } from '@/fsd/4-entities/shops';

import { rewardInfo } from '@/fsd/3-features/shop-rewards';

import { MissionsSection } from '@/fsd/2-widgets/mission-chains';

interface Props {
    missions: IEventMissions | undefined;
}

const EMPTY_MISSIONS: IEventMissions = { daily: [], free: [], premium: [], battlePass: [] };

export const MissionsTab: React.FC<Props> = ({ missions }) => (
    <MissionsSection missions={missions ?? EMPTY_MISSIONS} rewardInfo={rewardInfo} />
);
