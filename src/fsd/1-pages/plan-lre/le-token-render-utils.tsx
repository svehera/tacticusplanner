/* eslint-disable import-x/no-internal-modules */

import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
import { StarsIcon } from '@/fsd/5-shared/ui/icons/stars.icon';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

// eslint-disable-next-line boundaries/element-types
import { CharactersService } from '@/fsd/4-entities/character/@x/npc';
import { LreTrackId } from '@/fsd/4-entities/lre';
import { LreReqImage } from '@/fsd/4-entities/lre/lre-req-image';

import { getRequirementStatus } from './lre-requirement-status.utils';
import { ILreRequirements, ILreTrackProgress } from './lre.models';
import { STATUS_COLORS } from './requirement-status-constants';
import { milestonesAndPoints } from './token-estimation-service';

const getOrdinal = (num: number) => {
    if (num == 1) return '1st';
    if (num == 2) return '2nd';
    if (num == 3) return '3rd';
    return num + 'th';
};

const getSeverityClass = (severity: number) => {
    const index = severity < 0 ? 0 : severity > 2 ? 2 : severity;
    const classes = [
        'text-[#b00] dark:text-red-400',
        'text-[#bb0] dark:text-yellow-400',
        'text-[#0b0] dark:text-green-400',
    ];
    return classes[index];
};

export const renderMilestone = (milestoneIndex: number) => {
    if (milestoneIndex === -1 || milestoneIndex >= milestonesAndPoints.length) {
        return <></>;
    }
    const milestone = milestonesAndPoints[milestoneIndex];
    return (
        <div className="flex flex-col items-center justify-center p-1 border border-gray-400 dark:border-gray-600 rounded-lg bg-blue-100 dark:bg-gray-700/50 min-w-[70px]">
            <div className="flex items-center text-lg font-bold text-gray-800 dark:text-white">
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
                <span className={getSeverityClass(3 - milestone.round)}>{getOrdinal(milestone.round)} Round</span>
            </div>
            <div className="text-[10px] whitespace-nowrap">
                <span className={getSeverityClass(2 - milestone.packsPerRound)}>
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
    tracksProgress: ILreTrackProgress[],
    track: LreTrackId,
    battleNumber: number,
    sizePx?: number
) => (
    <div className="flex items-center gap-1">
        {restricts.map((restrict, i) => {
            if (restrict.id === '_killPoints' || restrict.id === '_highScore') {
                return <span key={`${track}-${battleNumber}-${restrict.id}`} />;
            }

            const status = getRequirementStatus(tracksProgress, track, battleNumber, restrict.id);
            const borderColor = STATUS_COLORS[status];

            return (
                <div
                    key={`${restrict.id}-${i}`}
                    style={{
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: borderColor,
                        borderRadius: '4px',
                        padding: '2px',
                    }}>
                    <LreReqImage iconId={restrict.iconId} tooltip={restrict.name} sizePx={sizePx ?? 25} />
                </div>
            );
        })}
    </div>
);

export const renderTeam = (team: string[], sizePx?: number) => (
    <div className="flex flex-row justify-center -space-x-1 flex-nowrap">
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
