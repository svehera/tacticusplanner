import { useContext, useState } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { ILegendaryEvent, LreTrackId } from 'src/models/interfaces';
import { LrePointsCategoryId, ProgressState } from 'src/models/enums';
import { ILreOccurrenceProgress, ILreProgressModel } from 'src/v2/features/lre/lre.models';
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

            if (state === ProgressState.completed) {
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
            } else if (state === ProgressState.blocked) {
                reqProgress.blocked = true;
                reqProgress.completed = false;
            } else {
                reqProgress.completed = false;
                reqProgress.blocked = false;
            }
            return updateDto({ ...currModel });
        });
    };

    return { model, updateNotes, updateOccurrenceProgress, toggleBattleState: setBattleState };
};
