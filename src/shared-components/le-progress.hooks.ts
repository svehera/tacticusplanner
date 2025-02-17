import { useContext, useState } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { ILegendaryEvent, LreTrackId } from 'src/models/interfaces';
import { LrePointsCategoryId, ProgressState } from 'src/models/enums';
import {
    ILreBattleRequirementsProgress,
    ILreOccurrenceProgress,
    ILreProgressModel,
} from 'src/v2/features/lre/lre.models';
import { useDebounceCallback } from 'usehooks-ts';
import { LreService } from 'src/v2/features/lre/lre.service';

export const useLreProgress = (legendaryEvent: ILegendaryEvent) => {
    const { leProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [model, setModel] = useState(LreService.mapProgressDtoToModel(leProgress[legendaryEvent.id], legendaryEvent));

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

    const setBattleState = (trackId: LreTrackId, battleIndex: number, reqId: string, state: ProgressState) => {
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

            if (state === ProgressState.completed) {
                updatedReqProgress = { ...reqProgress, completed: true, blocked: false };

                if (
                    !autoCompleteReqs.includes(reqProgress.id as LrePointsCategoryId) ||
                    reqProgress.id === LrePointsCategoryId.defeatAll
                ) {
                    updatedRequirementsProgress = updatedRequirementsProgress.map(req =>
                        autoCompleteReqs.includes(req.id as LrePointsCategoryId)
                            ? { ...req, completed: true, blocked: false }
                            : req
                    );
                }
            } else if (state === ProgressState.blocked) {
                updatedReqProgress = { ...reqProgress, completed: false, blocked: true };
            } else {
                updatedReqProgress = { ...reqProgress, completed: false, blocked: false };
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

    return { model, updateNotes, updateOccurrenceProgress, toggleBattleState: setBattleState };
};
