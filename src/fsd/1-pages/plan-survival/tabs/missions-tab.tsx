import React from 'react';

import { ISurvivalEvent, survivalRewardInfo } from '@/fsd/4-entities/survival';

import { MissionsSection } from '@/fsd/2-widgets/mission-chains';

interface Props {
    event: ISurvivalEvent;
}

export const MissionsTab: React.FC<Props> = ({ event }) => (
    <MissionsSection missions={event.missions} rewardInfo={survivalRewardInfo} />
);
