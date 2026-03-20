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

const createNewModel = (
    currentModel: ILreProgressModel,
    trackId: LreTrackId,
    battleIndex: number,
    requirementId: string,
    status: RequirementStatus,
    forceOverwrite = false
): ILreProgressModel => {
    const trackProgressIndex = currentModel.tracksProgress.findIndex(x => x.trackId === trackId);
    if (trackProgressIndex === -1) return currentModel;

    const trackProgress = currentModel.tracksProgress[trackProgressIndex];
    const battleProgressIndex = trackProgress.battles.findIndex(x => x.battleIndex === battleIndex);
    if (battleProgressIndex === -1) return currentModel;

    const battleProgress = trackProgress.battles[battleProgressIndex];
    const requirementProgressIndex = battleProgress.requirementsProgress.findIndex(x => x.id === requirementId);
    if (requirementProgressIndex === -1) return currentModel;

    const requirementProgress = battleProgress.requirementsProgress[requirementProgressIndex];

    const autoCompleteReqs = [
        LrePointsCategoryId.defeatAll,
        LrePointsCategoryId.killScore,
        LrePointsCategoryId.highScore,
    ];

    let updatedRequirementProgress: ILreBattleRequirementsProgress;
    let updatedRequirementsProgress = [...battleProgress.requirementsProgress];

    if (status === RequirementStatus.Cleared) {
        updatedRequirementProgress = {
            ...requirementProgress,
            completed: true,
            blocked: false,
            // When completed, always set to Cleared status (unless preserving PartiallyCleared for killScore/highScore)
            status:
                !forceOverwrite &&
                requirementProgress.status === RequirementStatus.PartiallyCleared &&
                (requirementProgress.id === LrePointsCategoryId.killScore ||
                    requirementProgress.id === LrePointsCategoryId.highScore)
                    ? RequirementStatus.PartiallyCleared
                    : RequirementStatus.Cleared,
            // Clear killScore/highScore when forcing to Cleared
            killScore: forceOverwrite ? undefined : requirementProgress.killScore,
            highScore: forceOverwrite ? undefined : requirementProgress.highScore,
        };

        // If marking a non-auto requirement (restriction) as complete, auto-complete defeatAll, killScore, and highScore
        if (!autoCompleteReqs.includes(requirementProgress.id as LrePointsCategoryId)) {
            updatedRequirementsProgress = updatedRequirementsProgress.map(requirement =>
                autoCompleteReqs.includes(requirement.id as LrePointsCategoryId)
                    ? {
                          ...requirement,
                          completed: true,
                          blocked: false,
                          status: 1,
                          killScore: undefined,
                          highScore: undefined,
                      }
                    : requirement
            );
        }
        // If marking defeatAll as complete, also mark killScore and highScore as complete (but leave restrictions as-is)
        else if (requirementProgress.id === LrePointsCategoryId.defeatAll) {
            updatedRequirementsProgress = updatedRequirementsProgress.map(requirement =>
                autoCompleteReqs.includes(requirement.id as LrePointsCategoryId)
                    ? {
                          ...requirement,
                          completed: true,
                          blocked: false,
                          status: 1,
                          killScore: undefined,
                          highScore: undefined,
                      }
                    : requirement
            );
        }
    } else if (status === RequirementStatus.StopHere) {
        updatedRequirementProgress = {
            ...requirementProgress,
            completed: false,
            blocked: true,
            // If forceOverwrite, set to StopHere; otherwise preserve
            status: RequirementStatus.StopHere,
            killScore: forceOverwrite ? undefined : requirementProgress.killScore,
            highScore: forceOverwrite ? undefined : requirementProgress.highScore,
        };
    } else {
        updatedRequirementProgress = {
            ...requirementProgress,
            completed: false,
            blocked: false,
            status: status,
            killScore: forceOverwrite ? undefined : requirementProgress.killScore,
            highScore: forceOverwrite ? undefined : requirementProgress.highScore,
        };
    }

    updatedRequirementsProgress[requirementProgressIndex] = updatedRequirementProgress;
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

    const setBattleState = (
        trackId: LreTrackId,
        battleIndex: number,
        requirementId: string,
        status: RequirementStatus,
        forceOverwrite = false
    ) => {
        updateDto(createNewModel(model, trackId, battleIndex, requirementId, status, forceOverwrite));
    };

    return { model, createNewModel, updateDto, updateNotes, updateOccurrenceProgress, setBattleState };
};
