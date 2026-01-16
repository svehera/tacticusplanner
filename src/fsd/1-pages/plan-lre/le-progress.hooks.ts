import { useContext, useEffect, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { LreTrackId } from '@/fsd/4-entities/lre';

import { ILegendaryEvent, RequirementStatus } from '@/fsd/3-features/lre';
import { LrePointsCategoryId } from '@/fsd/3-features/lre-progress';

import { ILreProgressModel, ILreOccurrenceProgress, ILreBattleRequirementsProgress } from './lre.models';
import { LreService } from './lre.service';
export const useLreProgress = (legendaryEvent: ILegendaryEvent) => {
    const { leProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [model, setModel] = useState(LreService.mapProgressDtoToModel(leProgress[legendaryEvent.id], legendaryEvent));

    useEffect(() => {
        setModel(LreService.mapProgressDtoToModel(leProgress[legendaryEvent.id], legendaryEvent));
    }, [leProgress, legendaryEvent]);

    const updateDto = (newModel: ILreProgressModel): ILreProgressModel => {
        dispatch.leProgress({
            type: 'Update',
            value: LreService.mapProgressModelToDto(newModel),
            eventId: newModel.eventId,
        });
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

    const updateOccurrenceProgress = (occurrence: ILreOccurrenceProgress) => {
        setModel(currModel => {
            const occurrenceProgress = currModel.occurrenceProgress;
            occurrenceProgress[occurrence.eventOccurrence - 1] = occurrence;
            return updateDto({ ...currModel, occurrenceProgress: [...occurrenceProgress] });
        });
    };

    const setBattleState = (
        trackId: LreTrackId,
        battleIndex: number,
        reqId: string,
        status: RequirementStatus,
        forceOverwrite = false
    ) => {
        setModel(currModel => {
            const trackProgressIndex = currModel.tracksProgress.findIndex(x => x.trackId === trackId);
            if (trackProgressIndex === -1) return currModel;

            const trackProgress = currModel.tracksProgress[trackProgressIndex];
            const battleProgressIndex = trackProgress.battles.findIndex(x => x.battleIndex === battleIndex);
            if (battleProgressIndex === -1) return currModel;

            const battleProgress = trackProgress.battles[battleProgressIndex];
            const reqProgressIndex = battleProgress.requirementsProgress.findIndex(x => x.id === reqId);
            if (reqProgressIndex === -1) return currModel;

            const reqProgress = battleProgress.requirementsProgress[reqProgressIndex];

            const autoCompleteReqs = [
                LrePointsCategoryId.defeatAll,
                LrePointsCategoryId.killScore,
                LrePointsCategoryId.highScore,
            ];

            let updatedReqProgress: ILreBattleRequirementsProgress;
            let updatedRequirementsProgress = [...battleProgress.requirementsProgress];

            if (status === RequirementStatus.Cleared) {
                updatedReqProgress = {
                    ...reqProgress,
                    completed: true,
                    blocked: false,
                    // When completed, always set to Cleared status (unless preserving PartiallyCleared for killScore/highScore)
                    status:
                        !forceOverwrite &&
                        reqProgress.status === RequirementStatus.PartiallyCleared &&
                        (reqProgress.id === LrePointsCategoryId.killScore ||
                            reqProgress.id === LrePointsCategoryId.highScore)
                            ? RequirementStatus.PartiallyCleared
                            : RequirementStatus.Cleared,
                    // Clear killScore/highScore when forcing to Cleared
                    killScore: forceOverwrite ? undefined : reqProgress.killScore,
                    highScore: forceOverwrite ? undefined : reqProgress.highScore,
                };

                // If marking a non-auto requirement (restriction) as complete, auto-complete defeatAll, killScore, and highScore
                if (!autoCompleteReqs.includes(reqProgress.id as LrePointsCategoryId)) {
                    updatedRequirementsProgress = updatedRequirementsProgress.map(req =>
                        autoCompleteReqs.includes(req.id as LrePointsCategoryId)
                            ? {
                                  ...req,
                                  completed: true,
                                  blocked: false,
                                  status: 1,
                                  killScore: undefined,
                                  highScore: undefined,
                              }
                            : req
                    );
                }
                // If marking defeatAll as complete, also mark killScore and highScore as complete (but leave restrictions as-is)
                else if (reqProgress.id === LrePointsCategoryId.defeatAll) {
                    updatedRequirementsProgress = updatedRequirementsProgress.map(req =>
                        autoCompleteReqs.includes(req.id as LrePointsCategoryId)
                            ? {
                                  ...req,
                                  completed: true,
                                  blocked: false,
                                  status: 1,
                                  killScore: undefined,
                                  highScore: undefined,
                              }
                            : req
                    );
                }
            } else if (status === RequirementStatus.StopHere) {
                updatedReqProgress = {
                    ...reqProgress,
                    completed: false,
                    blocked: true,
                    // If forceOverwrite, set to StopHere; otherwise preserve
                    status: RequirementStatus.StopHere,
                    killScore: forceOverwrite ? undefined : reqProgress.killScore,
                    highScore: forceOverwrite ? undefined : reqProgress.highScore,
                };
            } else {
                updatedReqProgress = {
                    ...reqProgress,
                    completed: false,
                    blocked: false,
                    status: status,
                    killScore: forceOverwrite ? undefined : reqProgress.killScore,
                    highScore: forceOverwrite ? undefined : reqProgress.highScore,
                };
            }

            updatedRequirementsProgress[reqProgressIndex] = updatedReqProgress;
            const updatedBattleProgress = {
                ...battleProgress,
                requirementsProgress: updatedRequirementsProgress,
            };

            const updatedBattles = [...trackProgress.battles];
            updatedBattles[battleProgressIndex] = updatedBattleProgress;

            const updatedTrackProgress = {
                ...trackProgress,
                battles: updatedBattles,
            };

            const updatedTracksProgress = [...currModel.tracksProgress];
            updatedTracksProgress[trackProgressIndex] = updatedTrackProgress;

            return updateDto({ ...currModel, tracksProgress: updatedTracksProgress });
        });
    };

    return { model, updateNotes, updateOccurrenceProgress, setBattleState };
};
