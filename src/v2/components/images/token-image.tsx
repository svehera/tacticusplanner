import { getImageUrl } from 'src/shared-logic/functions';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { GameMode } from 'src/v2/features/teams/teams.enums';

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
        case GameMode.legendaryRelease:
            tooltipText = 'Legendary Event';
            break;
        case GameMode.incursion:
            tooltipText = 'Incursion';
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
