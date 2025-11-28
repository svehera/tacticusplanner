/* eslint-disable import-x/no-internal-modules */
import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

// eslint-disable-next-line boundaries/element-types
import { CharactersService } from '@/fsd/4-entities/character/@x/npc';
import { LreReqImage } from '@/fsd/4-entities/lre/lre-req-image';

import { ILreRequirements } from './lre.models';
import { milestonesAndPoints } from './token-estimation-service';

const getOrdinal = (num: number) => {
    if (num == 1) return '1st';
    if (num == 2) return '2nd';
    if (num == 3) return '3rd';
    return num + 'th';
};

const getTextColor = (severity: number, isDarkMode: boolean) => {
    const lightText = ['#b00', '#bb0', '#0b0'];
    const darkText = ['#f87171', '#facc15', '#4ade80'];
    const index = severity < 0 ? 0 : severity > 2 ? 2 : severity;
    return isDarkMode ? darkText[index] : lightText[index];
};

export const renderMilestone = (milestoneIndex: number, isDarkMode: boolean) => {
    if (milestoneIndex === -1 || milestoneIndex >= milestonesAndPoints.length) {
        return <></>;
    }
    const milestone = milestonesAndPoints[milestoneIndex];
    return (
        <div className="flex flex-col items-center justify-center p-1 border border-gray-600 rounded-lg bg-gray-700/50 min-w-[70px]">
            <div className="flex items-center text-lg font-bold">
                {milestone.points >= milestonesAndPoints[milestonesAndPoints.length - 1]?.points ? (
                    '100%'
                ) : (
                    <>
                        {milestone.stars == 7 ? (
                            <RarityIcon rarity={Rarity.Mythic} />
                        ) : (
                            <StarsIcon stars={milestone.stars + 5 - (milestone.stars >= 7 ? 1 : 0)} />
                        )}
                    </>
                )}
            </div>
            <div className="text-xs font-medium mt-0.5 whitespace-nowrap">
                <span style={{ color: getTextColor(3 - milestone.round, isDarkMode) }}>
                    {getOrdinal(milestone.round)} Round
                </span>
            </div>
            <div className="text-[10px] whitespace-nowrap">
                <span style={{ color: getTextColor(2 - milestone.packsPerRound, isDarkMode) }}>
                    {milestone.packsPerRound == 2
                        ? 'w/ both packs'
                        : milestone.packsPerRound == 1
                          ? 'w/ premium'
                          : 'w/ free'}
                </span>
            </div>
        </div>
    );
};

export const renderRestrictions = (
    restricts: ILreRequirements[],
    track: string,
    battleNumber: number,
    sizePx?: number
) => (
    <div className="flex items-center gap-1">
        {restricts.map((restrict, i) =>
            restrict.id === '_killPoints' || restrict.id === '_highScore' ? (
                <span key={track + battleNumber + restrict.id} />
            ) : (
                <LreReqImage
                    key={restrict.iconId + i}
                    iconId={restrict.iconId}
                    tooltip={restrict.name}
                    sizePx={sizePx ?? 25}
                />
            )
        )}
    </div>
);

export const renderTeam = (team: string[], sizePx?: number) => (
    <div className="flex flex-row flex-nowrap justify-center -space-x-1">
        {team.map((snowprintId: string, i) => {
            const unit = CharactersService.getUnit(snowprintId);
            return (
                <UnitShardIcon
                    key={snowprintId + i}
                    icon={unit?.roundIcon ?? ''}
                    height={sizePx ?? 25}
                    tooltip={unit?.name ?? snowprintId}
                />
            );
        })}
    </div>
);
