/* eslint-disable import-x/no-internal-modules */

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

// eslint-disable-next-line boundaries/element-types
import { CharactersService } from '@/fsd/4-entities/character/@x/npc';
import { LreTrackId } from '@/fsd/4-entities/lre';
import { LreRequirementImage } from '@/fsd/4-entities/lre/lre-requirement-image';

import { LrePointsCategoryId } from '@/fsd/3-features/lre-progress';

import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreRequirements, ILreTrackProgress } from './lre.models';
import { STATUS_BORDER_SOLID_CLASSES } from './requirement-status-constants';

export const renderRestrictions = (
    restricts: ILreRequirements[],
    tracksProgress: readonly ILreTrackProgress[],
    track: LreTrackId,
    battleNumber: number,
    sizePx?: number
) => (
    <div className="flex items-center gap-1">
        {restricts.map((restrict, index) => {
            if (restrict.id === LrePointsCategoryId.killScore || restrict.id === LrePointsCategoryId.highScore) {
                return <span key={`${track}-${battleNumber}-${restrict.id}`} />;
            }

            const status = LreRequirementStatusService.getRequirementStatus(
                tracksProgress,
                track,
                battleNumber,
                restrict.id
            );

            return (
                <div
                    key={`${restrict.id}-${index}`}
                    className={`rounded border-2 p-0.5 ${STATUS_BORDER_SOLID_CLASSES[status]}`}>
                    <LreRequirementImage
                        iconId={restrict.iconId}
                        tooltip={`${restrict.name} - ${restrict.pointsPerBattle}`}
                        sizePx={sizePx ?? 25}
                    />
                </div>
            );
        })}
    </div>
);

export const renderTeam = (team: string[], sizePx?: number) => (
    <div className="flex flex-row flex-nowrap justify-center -space-x-1">
        {team.map((snowprintId: string, index) => {
            const unit = CharactersService.getUnit(snowprintId);
            return (
                <UnitShardIcon
                    key={snowprintId + index}
                    icon={unit?.roundIcon ?? ''}
                    width={sizePx === undefined ? 25 : sizePx + 15}
                    height={sizePx ?? 25}
                    tooltip={unit?.name ?? snowprintId}
                />
            );
        })}
    </div>
);
