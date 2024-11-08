import { useContext, useState } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { ILegendaryEvent, LreTrackId } from 'src/models/interfaces';
import { LegendaryEventEnum, LrePointsCategoryId, ProgressState } from 'src/models/enums';
import { ILreBattleProgressDto, ILreOverviewDto, ILreProgressDto } from 'src/models/dto.interfaces';
import {
    ILreBattleProgress,
    ILreBattleRequirementsProgress,
    ILreOccurrenceProgress,
    ILreProgressModel,
    ILreRequirements,
    ILreTrackProgress,
} from 'src/v2/features/lre/lre.models';
import { useDebounceCallback } from 'usehooks-ts';
import { orderBy, sum } from 'lodash';

export const useLreProgress = (legendaryEvent: ILegendaryEvent) => {
    const { leProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [model, setModel] = useState(mapDtoToModel(leProgress[legendaryEvent.id], legendaryEvent));
    console.log(model);

    const updateDto = (newModel: ILreProgressModel): ILreProgressModel => {
        dispatch.leProgress({ type: 'Update', value: mapModelToDto(newModel), eventId: newModel.eventId });
        return newModel;
    };

    const debounceUpdateDto = useDebounceCallback(updateDto, 500);

    const updateNotes = (notes: string) => {
        setModel(currModel => {
            const newModel: ILreProgressModel = { ...currModel, notes };
            debounceUpdateDto(newModel);
            return newModel;
        });
    };

    const updateOccurenceProgress = (occurence: ILreOccurrenceProgress) => {
        setModel(currModel => {
            const occurrenceProgress = currModel.occurrenceProgress;
            occurrenceProgress[occurence.eventOccurrence - 1] = occurence;
            return updateDto({ ...currModel, occurrenceProgress: [...occurrenceProgress] });
        });
    };

    const toggleBattleState = (trackId: LreTrackId, battleIndex: number, reqId: string) => {
        setModel(currModel => {
            const trackProgress = currModel.tracksProgress.find(x => x.trackId === trackId);
            if (!trackProgress) {
                return currModel;
            }
            const battleProgress = trackProgress.battles.find(x => x.battleIndex === battleIndex);
            if (!battleProgress) {
                return currModel;
            }
            const reqProgress = battleProgress.requirementsProgress.find(x => x.id === reqId);
            if (!reqProgress) {
                return currModel;
            }

            const autoCompleteReqs = [
                LrePointsCategoryId.defeatAll,
                LrePointsCategoryId.killScore,
                LrePointsCategoryId.highScore,
            ];

            if (reqProgress.completed) {
                reqProgress.completed = false;
                reqProgress.blocked = true;
            } else if (reqProgress.blocked) {
                reqProgress.blocked = false;
                reqProgress.completed = false;
            } else {
                reqProgress.completed = true;
                reqProgress.blocked = false;

                if (
                    !autoCompleteReqs.includes(reqProgress.id as LrePointsCategoryId) ||
                    reqProgress.id === LrePointsCategoryId.defeatAll
                ) {
                    battleProgress.requirementsProgress
                        .filter(x => autoCompleteReqs.includes(x.id as LrePointsCategoryId))
                        .forEach(x => {
                            x.completed = true;
                            x.blocked = false;
                        });
                }
            }
            return updateDto({ ...currModel });
        });
    };

    return { model, updateNotes, updateOccurenceProgress, toggleBattleState };
};

const mapDtoToModel = (dto: ILreProgressDto | undefined, lre: ILegendaryEvent): ILreProgressModel => {
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
                    points: flexPointsCategories.includes(req.id as LrePointsCategoryId) ? points : req.pointsPerBattle,
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
        const totalPoints = sum(track.battlesPoints.map(battlePoints => battlePoints * 2 + requirementsTotalPoints));

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
    };
};

const mapModelToDto = (model: ILreProgressModel): ILreProgressDto => {
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
