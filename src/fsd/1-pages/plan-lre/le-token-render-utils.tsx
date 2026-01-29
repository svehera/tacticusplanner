/* eslint-disable import-x/no-internal-modules */

import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

// eslint-disable-next-line boundaries/element-types
import { CharactersService } from '@/fsd/4-entities/character/@x/npc';
import { LreTrackId } from '@/fsd/4-entities/lre';
import { LreReqImage } from '@/fsd/4-entities/lre/lre-req-image';

import { LrePointsCategoryId } from '@/fsd/3-features/lre-progress';

import { LreRequirementStatusService } from './lre-requirement-status.service';
import { ILreRequirements, ILreTrackProgress } from './lre.models';
import { STATUS_COLORS } from './requirement-status-constants';

export const renderRestrictions = (
    restricts: ILreRequirements[],
    tracksProgress: ILreTrackProgress[],
    track: LreTrackId,
    battleNumber: number,
    sizePx?: number
) => (
    <div className="flex items-center gap-1">
        {restricts.map((restrict, i) => {
            if (restrict.id === LrePointsCategoryId.killScore || restrict.id === LrePointsCategoryId.highScore) {
                return <span key={`${track}-${battleNumber}-${restrict.id}`} />;
            }

            const status = LreRequirementStatusService.getRequirementStatus(
                tracksProgress,
                track,
                battleNumber,
                restrict.id
            );
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
                    <LreReqImage
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
