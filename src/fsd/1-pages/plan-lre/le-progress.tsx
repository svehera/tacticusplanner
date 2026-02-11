import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Button, TextField } from '@mui/material';
import { sum } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import { LeNextGoalProgress } from './le-next-goal-progress';
import { LeProgressOverviewMissions } from './le-progress-overview-missions';
import { useLreProgress } from './le-progress.hooks';
import { LreTrackOverallProgress } from './le-track-overall-progress';
import { EventProgress } from './token-estimation-service';

/**
 * UI Element to display the progress of missions and tracks in a legendary event.
 */
export const LeProgress = ({
    legendaryEvent,
    progress,
}: {
    legendaryEvent: ILegendaryEvent;
    progress: EventProgress;
}) => {
    const { leSelectedTeams, leSettings } = useContext(StoreContext);
    const { model, updateNotes, updateOccurrenceProgress, createNewModel, updateDto } = useLreProgress(legendaryEvent);
    const [accordionExpanded, setAccordionExpanded] = useState<string | false>('tracks');

    const teams = leSelectedTeams[legendaryEvent.id]?.teams ?? [];

    const handleAccordionChange = (section: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setAccordionExpanded(isExpanded ? section : false);
    };

    const [notesDraft, setNotesDraft] = useState(model.notes);

    const tracksTotalProgress = model.tracksProgress
        .map(track =>
            Math.round(
                (sum(
                    track.battles
                        .flatMap(x => x.requirementsProgress)
                        .filter(x => x.completed)
                        .map(x => x.points)
                ) /
                    track.totalPoints) *
                    100
            )
        )
        .join('-');

    return (
        <div className="gap-2">
            <div className="w-full">
                <LeNextGoalProgress progress={progress} />
                <Accordion
                    TransitionProps={{ unmountOnExit: true }}
                    expanded={accordionExpanded === 'missionAndNotes'}
                    onChange={handleAccordionChange('missionAndNotes')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <span>Notes & Missions</span>
                    </AccordionSummary>

                    <AccordionDetails className="flex-box wrap gap20">
                        <div className="flex-box column start flex-1 min-w-[450px]">
                            <div className="w-full">
                                {(() => {
                                    const hasUnsaved = notesDraft !== model.notes;
                                    useEffect(() => {
                                        const handler = (e: any) => {
                                            if (!hasUnsaved) return;
                                            e.preventDefault();
                                            // Some browsers show a default message when returnValue is set.
                                            e.returnValue = '';
                                            return '';
                                        };
                                        window.addEventListener('beforeunload', handler);
                                        return () => window.removeEventListener('beforeunload', handler);
                                    }, [hasUnsaved]);

                                    return null;
                                })()}

                                <TextField
                                    className="mt-5"
                                    fullWidth
                                    id="outlined-textarea"
                                    label="Notes"
                                    placeholder="Notes"
                                    multiline
                                    value={notesDraft}
                                    helperText={notesDraft.length + '/10000'}
                                    onChange={event => {
                                        setNotesDraft(event.target.value.slice(0, 10000));
                                    }}
                                />

                                {notesDraft !== model.notes && (
                                    <div className="mt-2 text-sm text-yellow-700">
                                        You have unsaved changes — they will be lost if you leave this page.
                                    </div>
                                )}

                                <div className="mt-3 w-full text-right">
                                    <Button
                                        size="small"
                                        aria-label="Sync with Tacticus"
                                        title="Sync with Tacticus"
                                        variant="contained"
                                        color="primary"
                                        onClick={() => updateNotes(notesDraft)}>
                                        Save
                                    </Button>
                                </div>
                            </div>

                            {model.syncedProgress === undefined &&
                                model.occurrenceProgress.map(occurrence => (
                                    <LeProgressOverviewMissions
                                        showP2P={leSettings.showP2POptions}
                                        key={occurrence.eventOccurrence}
                                        occurrence={occurrence}
                                        progressChange={updateOccurrenceProgress}
                                    />
                                ))}

                            <div className="flex-box wrap gap-x-[50px]">
                                <div className="flex-box column start flex-1 min-w-[450px]">
                                    <h4>Free missions</h4>
                                    {model.regularMissions.map((mission, index) => (
                                        <span key={index}>
                                            {index + 1}. {mission}
                                        </span>
                                    ))}
                                </div>

                                {leSettings.showP2POptions && (
                                    <div className="flex-box column start flex-1 min-w-[450px]">
                                        <h4>Premium missions</h4>
                                        {model.premiumMissions.map((mission, index) => (
                                            <span key={index}>
                                                {index + 1}. {mission}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    TransitionProps={{ unmountOnExit: true }}
                    expanded={accordionExpanded === 'tracks'}
                    onChange={handleAccordionChange('tracks')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <div className="flex-box gap5">
                            <span>
                                Tracks Progress <span className="font-bold">({tracksTotalProgress})</span>
                            </span>
                        </div>
                    </AccordionSummary>

                    <AccordionDetails className="box-border flex flex-wrap start">
                        {model.tracksProgress.map(track => (
                            <LreTrackOverallProgress
                                key={track.trackId}
                                track={track}
                                legendaryEventId={legendaryEvent.id}
                                teams={teams}
                                createNewModel={createNewModel}
                                updateDto={updateDto}
                                model={model}
                            />
                        ))}
                    </AccordionDetails>
                </Accordion>
            </div>
            <div className="h-[5px] w-full"></div>
        </div>
    );
};
