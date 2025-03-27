import React from 'react';
import { ILegendaryEvent } from '../models/interfaces';
import { useLreProgress } from 'src/shared-components/le-progress.hooks';
import { LeNextGoalProgress } from 'src/shared-components/le-next-goal-progress';
import { Accordion, AccordionDetails, AccordionSummary, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LeProgressOverviewMissions } from 'src/shared-components/le-progress-overview-missions';
import { LreTrackOverallProgress } from 'src/shared-components/le-track-overall-progress';
import { sum } from 'lodash';
import { isMobile } from 'react-device-detect';

export const LeProgress = ({ legendaryEvent }: { legendaryEvent: ILegendaryEvent }) => {
    const { model, updateNotes, updateOccurrenceProgress, toggleBattleState } = useLreProgress(legendaryEvent);
    const [accordionExpanded, setAccordionExpanded] = React.useState<string | false>('tracks');

    const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setAccordionExpanded(isExpanded ? section : false);
    };

    const missionsTotalProgress = model.occurrenceProgress.map(x => x.freeMissionsProgress.toString()).join('-');
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
        <div>
            <LeNextGoalProgress model={model} />
            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                expanded={accordionExpanded === 'missionAndNotes'}
                onChange={handleAccordionChange('missionAndNotes')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <span>
                        Notes & Missions Progress <span className="bold">({missionsTotalProgress})</span>
                    </span>
                </AccordionSummary>

                <AccordionDetails className="flex-box wrap gap20">
                    <TextField
                        style={{ marginTop: 20 }}
                        fullWidth
                        id="outlined-textarea"
                        label="Notes"
                        placeholder="Notes"
                        multiline
                        value={model.notes}
                        helperText={model.notes.length + '/10000'}
                        onChange={event => updateNotes(event.target.value.slice(0, 10000))}
                    />

                    {model.occurrenceProgress.map(occurrence => (
                        <LeProgressOverviewMissions
                            key={occurrence.eventOccurrence}
                            occurence={occurrence}
                            progressChange={updateOccurrenceProgress}
                        />
                    ))}

                    <div className="flex-box wrap" style={{ columnGap: 50 }}>
                        <div className="flex-box column start" style={{ flex: 1, minWidth: 450 }}>
                            <h4>Free missions</h4>
                            {model.regularMissions.map((mission, index) => (
                                <span key={index}>
                                    {index + 1}. {mission}
                                </span>
                            ))}
                        </div>

                        <div className="flex-box column start" style={{ flex: 1, minWidth: 450 }}>
                            <h4>Premium missions</h4>
                            {model.premiumMissions.map((mission, index) => (
                                <span key={index}>
                                    {index + 1}. {mission}
                                </span>
                            ))}
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
                            Tracks Progress <span className="bold">({tracksTotalProgress})</span>
                        </span>
                        {isMobile ? (
                            <span>Use Long press to put requirement in intermediate state</span>
                        ) : (
                            <span>Use CTRL + Click to put requirement in intermediate state</span>
                        )}
                    </div>
                </AccordionSummary>

                <AccordionDetails className="flex-box start wrap gap20">
                    {model.tracksProgress.map(track => (
                        <LreTrackOverallProgress
                            key={track.trackId}
                            track={track}
                            toggleBattleState={toggleBattleState}
                        />
                    ))}
                </AccordionDetails>
            </Accordion>
        </div>
    );
};
