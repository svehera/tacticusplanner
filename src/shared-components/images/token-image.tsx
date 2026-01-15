import guildRaids from '@/assets/images/modes/_gr.png';
import guildWar from '@/assets/images/modes/_gw.png';
import incursion from '@/assets/images/modes/_inc.png';
import legendaryRelease from '@/assets/images/modes/_lre.png';
import survival from '@/assets/images/modes/_sur.png';
import tournamentArena from '@/assets/images/modes/_ta.png';

import { AccessibleTooltip } from '@/fsd/5-shared/ui';

import { GameMode } from '@/fsd/3-features/teams/teams.enums';

const imageMap = {
    [GameMode.guildRaids]: guildRaids,
    [GameMode.guildWar]: guildWar,
    [GameMode.incursion]: incursion,
    [GameMode.legendaryRelease]: legendaryRelease,
    [GameMode.survival]: survival,
    [GameMode.tournamentArena]: tournamentArena,
} as const;

const textMap = {
    [GameMode.guildRaids]: 'Guild Raids',
    [GameMode.guildWar]: 'Guild War',
    [GameMode.incursion]: 'Incursion',
    [GameMode.legendaryRelease]: 'Legendary Event',
    [GameMode.survival]: 'Survival',
    [GameMode.tournamentArena]: 'Tournament Arena',
} as const;

export const TokenImage = ({ gameMode }: { gameMode: GameMode }) => {
    return (
        <AccessibleTooltip title={textMap[gameMode]}>
            <span>
                <img
                    loading={'lazy'}
                    className="pointer-events-none"
                    src={imageMap[gameMode]}
                    height={40}
                    alt={textMap[gameMode]}
                />
            </span>
        </AccessibleTooltip>
    );
};
