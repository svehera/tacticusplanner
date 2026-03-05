import { produce } from 'immer';
import { useContext } from 'react';
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
    const model = LreService.mapProgressDtoToModel(leProgress[legendaryEvent.id], legendaryEvent);

    const updateDto = <T extends ILreProgressModel>(newModel: T) => {
        dispatch.leProgress({
            type: 'Update',
            value: LreService.mapProgressModelToDto(newModel),
            eventId: newModel.eventId,
        });
        return newModel;
    };

    const debounceUpdateDto = useDebounceCallback(updateDto, 500);

    const updateNotes = (notes: string) => {
        debounceUpdateDto({ ...model, notes });
    };

    const updateOccurrenceProgress = (occurrence: ILreOccurrenceProgress) => {
        const updatedProgress = produce(model, draft => {
            draft.occurrenceProgress[occurrence.eventOccurrence - 1] = occurrence;
        });
        return updateDto(updatedProgress);
    };

    const createNewModel = (
        currentModel: ILreProgressModel,
        trackId: LreTrackId,
        battleIndex: number,
        requestId: string,
        status: RequirementStatus,
        forceOverwrite = false
    ): ILreProgressModel => {
        const trackProgressIndex = currentModel.tracksProgress.findIndex(x => x.trackId === trackId);
        if (trackProgressIndex === -1) return currentModel;

        const trackProgress = currentModel.tracksProgress[trackProgressIndex];
        const battleProgressIndex = trackProgress.battles.findIndex(x => x.battleIndex === battleIndex);
        if (battleProgressIndex === -1) return currentModel;

        const battleProgress = trackProgress.battles[battleProgressIndex];
        const requestProgressIndex = battleProgress.requirementsProgress.findIndex(x => x.id === requestId);
        if (requestProgressIndex === -1) return currentModel;

        const requestProgress = battleProgress.requirementsProgress[requestProgressIndex];

        const autoCompleteReqs = new Set([
            LrePointsCategoryId.defeatAll,
            LrePointsCategoryId.killScore,
            LrePointsCategoryId.highScore,
        ]);

        let updatedRequestProgress: ILreBattleRequirementsProgress;
        let updatedRequirementsProgress = [...battleProgress.requirementsProgress];

        if (status === RequirementStatus.Cleared) {
            updatedRequestProgress = {
                ...requestProgress,
                completed: true,
                blocked: false,
                // When completed, always set to Cleared status (unless preserving PartiallyCleared for killScore/highScore)
                status:
                    !forceOverwrite &&
                    requestProgress.status === RequirementStatus.PartiallyCleared &&
                    (requestProgress.id === LrePointsCategoryId.killScore ||
                        requestProgress.id === LrePointsCategoryId.highScore)
                        ? RequirementStatus.PartiallyCleared
                        : RequirementStatus.Cleared,
                // Clear killScore/highScore when forcing to Cleared
                killScore: forceOverwrite ? undefined : requestProgress.killScore,
                highScore: forceOverwrite ? undefined : requestProgress.highScore,
            };

            // If marking a non-auto requirement (restriction) as complete, auto-complete defeatAll, killScore, and highScore
            if (!autoCompleteReqs.has(requestProgress.id as LrePointsCategoryId)) {
                updatedRequirementsProgress = updatedRequirementsProgress.map(request =>
                    autoCompleteReqs.has(request.id as LrePointsCategoryId)
                        ? {
                              ...request,
                              completed: true,
                              blocked: false,
                              status: 1,
                              killScore: undefined,
                              highScore: undefined,
                          }
                        : request
                );
            }
            // If marking defeatAll as complete, also mark killScore and highScore as complete (but leave restrictions as-is)
            else if (requestProgress.id === LrePointsCategoryId.defeatAll) {
                updatedRequirementsProgress = updatedRequirementsProgress.map(request =>
                    autoCompleteReqs.has(request.id as LrePointsCategoryId)
                        ? {
                              ...request,
                              completed: true,
                              blocked: false,
                              status: 1,
                              killScore: undefined,
                              highScore: undefined,
                          }
                        : request
                );
            }
        } else if (status === RequirementStatus.StopHere) {
            updatedRequestProgress = {
                ...requestProgress,
                completed: false,
                blocked: true,
                // If forceOverwrite, set to StopHere; otherwise preserve
                status: RequirementStatus.StopHere,
                killScore: forceOverwrite ? undefined : requestProgress.killScore,
                highScore: forceOverwrite ? undefined : requestProgress.highScore,
            };
        } else {
            updatedRequestProgress = {
                ...requestProgress,
                completed: false,
                blocked: false,
                status: status,
                killScore: forceOverwrite ? undefined : requestProgress.killScore,
                highScore: forceOverwrite ? undefined : requestProgress.highScore,
            };
        }

        updatedRequirementsProgress[requestProgressIndex] = updatedRequestProgress;
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

        const updatedTracksProgress = [...currentModel.tracksProgress];
        updatedTracksProgress[trackProgressIndex] = updatedTrackProgress;

        return { ...currentModel, tracksProgress: updatedTracksProgress };
    };

    const setBattleState = (
        trackId: LreTrackId,
        battleIndex: number,
        requestId: string,
        status: RequirementStatus,
        forceOverwrite = false
    ) => {
        updateDto(createNewModel(model, trackId, battleIndex, requestId, status, forceOverwrite));
    };

    return { model, createNewModel, updateDto, updateNotes, updateOccurrenceProgress, setBattleState };
};
