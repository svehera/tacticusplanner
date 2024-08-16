﻿import React from 'react';
import { getImageUrl } from 'src/shared-logic/functions';
import { GameMode } from 'src/v2/features/teams/teams.enums';
import { AccessibleTooltip } from 'src/v2/components/tooltip';

export const TokenImage = ({ gameMode }: { gameMode: GameMode }) => {
    const image = getImageUrl(`modes/${gameMode}.png`);

    let tooltipText = '';

    switch (gameMode) {
        case GameMode.tournamentArena:
            tooltipText = 'Tournament Arena';
            break;
        case GameMode.guildRaids:
            tooltipText = 'Guild Raids';
            break;
        case GameMode.guildWar:
            tooltipText = 'Guild War';
            break;
    }

    return (
        <AccessibleTooltip title={tooltipText}>
            <span>
                <img loading={'lazy'} style={{ pointerEvents: 'none' }} src={image} height={40} alt={gameMode} />
            </span>
        </AccessibleTooltip>
    );
};