import { orderBy, sum } from 'lodash';

import { LreTrackId, LegendaryEventEnum } from '@/fsd/4-entities/lre';

import { ILegendaryEvent } from '@/fsd/3-features/lre';
import {
    ILreBattleProgressDto,
    ILreOverviewDto,
    ILreProgressDto,
    LrePointsCategoryId,
    ProgressState,
} from '@/fsd/3-features/lre-progress';

import {
    ILreBattleProgress,
    ILreBattleRequirementsProgress,
    ILreOccurrenceProgress,
    ILreProgressModel,
    ILreRequirements,
    ILreTrackProgress,
} from './lre.models';

export class LreService {
    public static readonly getReqProgressPerTrack = (trackProgress: ILreTrackProgress) => {
        const completedReqs = trackProgress.battles.flatMap(x => x.requirementsProgress).filter(x => x.completed);
        const result: Record<string, number> = {};

        trackProgress.requirements.forEach(requirement => {
            result[requirement.id] = completedReqs.filter(x => x.id === requirement.id).length;
        });

        return result;
    };

    public static readonly mapProgressDtoToModel = (
        dto: ILreProgressDto | undefined,
        lre: ILegendaryEvent
    ): ILreProgressModel => {
        const occurrenceProgress: ILreOccurrenceProgress[] = [];
        const tracksProgress: ILreTrackProgress[] = [];

        const eventOccurence = [1, 2, 3];
        for (const occurence of eventOccurence) {
            const value: ILreOverviewDto = dto?.overview?.[occurence as 1 | 2 | 3] ?? {
                premiumMissions: 0,
                regularMissions: 0,
                bundle: 0,
            };
            occurrenceProgress.push({
                eventOccurrence: occurence as 1 | 2 | 3,
                premiumMissionsProgress: value.premiumMissions,
                freeMissionsProgress: value.regularMissions,
                bundlePurchased: !!value.bundle,
            });
        }

        const battlesDto = dto?.battlesProgress ?? [];
        for (const trackId of ['alpha', 'beta', 'gamma'] as LreTrackId[]) {
            const track = lre[trackId];
            const trackBattlesDto = battlesDto.filter(x => x.trackId === trackId);
            const trackBattlesRequirementsDto = trackBattlesDto.flatMap(x => x.requirements);
            const requirements: ILreRequirements[] = [
                {
                    id: LrePointsCategoryId.killScore,
                    name: 'Killscore',
                    pointsPerBattle: 0,
                    completed: false,
                    iconId: 'score',
                    totalPoints: sum(track.battlesPoints),
                },
                {
                    id: LrePointsCategoryId.highScore,
                    name: 'High Score',
                    pointsPerBattle: 0,
                    completed: false,
                    iconId: 'score',
                    totalPoints: sum(track.battlesPoints),
                },
                {
                    id: LrePointsCategoryId.defeatAll,
                    name: 'Defeat All',
                    pointsPerBattle: track.killPoints,
                    completed: false,
                    iconId: '_defeatAll',
                    totalPoints: track.battlesPoints.length * track.killPoints,
                },
                ...orderBy(track.unitsRestrictions, 'index').map(x => ({
                    id: x.name,
                    name: x.name,
                    pointsPerBattle: x.points,
                    completed: trackBattlesRequirementsDto
                        .filter(r => r.id === x.name)
                        .every(r => r.state === ProgressState.completed),
                    iconId: x.iconId ?? '',
                    totalPoints: track.battlesPoints.length * x.points,
                })),
            ];

            const battles: ILreBattleProgress[] = [];

            track.battlesPoints.forEach((points, index) => {
                const flexPointsCategories = [LrePointsCategoryId.killScore, LrePointsCategoryId.highScore];
                const battleProgress = trackBattlesDto.find(x => x.battleIndex === index);

                const requirementsProgress: ILreBattleRequirementsProgress[] = requirements.map(req => {
                    const reqProgress = battleProgress?.requirements.find(x => x.id === req.id);

                    return {
                        id: req.id,
                        iconId: req.iconId,
                        name: req.name,
                        points: flexPointsCategories.includes(req.id as LrePointsCategoryId)
                            ? points
                            : req.pointsPerBattle,
                        completed: reqProgress?.state === ProgressState.completed,
                        blocked: reqProgress?.state === ProgressState.blocked,
                    };
                });
                battles.push({
                    battleIndex: index,
                    requirementsProgress,
                    totalPoints: sum(requirementsProgress.map(x => x.points)),
                    completed: requirementsProgress.every(x => x.completed),
                });
            });

            requirements.forEach(req => {
                req.completed = battles
                    .flatMap(x => x.requirementsProgress)
                    .filter(x => x.id === req.id)
                    .every(x => x.completed);
            });

            const requirementsTotalPoints = sum(requirements.map(x => x.pointsPerBattle));
            const totalPoints = sum(
                track.battlesPoints.map(battlePoints => battlePoints * 2 + requirementsTotalPoints)
            );

            tracksProgress.push({
                trackId,
                trackName: lre[trackId].name,
                battlesPoints: track.battlesPoints,
                totalPoints,
                requirements,
                battles: battles.reverse(),
            });
        }

        return {
            eventId: dto?.id ?? lre.id,
            eventName: dto?.name ?? LegendaryEventEnum[lre.id],
            notes: dto?.notes ?? '',
            occurrenceProgress,
            tracksProgress,
            regularMissions: lre.regularMissions,
            premiumMissions: lre.premiumMissions,
            pointsMilestones: lre.pointsMilestones,
            chestsMilestones: lre.chestsMilestones,
            progression: lre.progression,
            shardsPerChest: lre.shardsPerChest,
        };
    };

    public static readonly mapProgressModelToDto = (model: ILreProgressModel): ILreProgressDto => {
        const overviewDto: Record<number, ILreOverviewDto> = {};
        for (const occurrenceProgress of model.occurrenceProgress) {
            overviewDto[occurrenceProgress.eventOccurrence] = {
                premiumMissions: occurrenceProgress.premiumMissionsProgress,
                regularMissions: occurrenceProgress.freeMissionsProgress,
                bundle: +occurrenceProgress.bundlePurchased,
            };
        }

        const battlesProgress: ILreBattleProgressDto[] = model.tracksProgress.flatMap(track =>
            track.battles
                .map(battle => ({
                    trackId: track.trackId,
                    battleIndex: battle.battleIndex,
                    requirements: battle.requirementsProgress
                        .map(requirement => ({
                            id: requirement.id,
                            state: requirement.completed
                                ? ProgressState.completed
                                : requirement.blocked
                                  ? ProgressState.blocked
                                  : ProgressState.none,
                        }))
                        .filter(x => x.state !== ProgressState.none),
                }))
                .filter(x => x.requirements.length)
        );

        return {
            id: model.eventId,
            name: model.eventName,
            notes: model.notes,
            battlesProgress,
            overview: overviewDto,
        };
    };
}
