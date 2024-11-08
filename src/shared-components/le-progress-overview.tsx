import React, { useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCompletionRateColor } from '../shared-logic/functions';
import { Tooltip } from '@mui/material';
import { LeProgressOverviewMissions } from 'src/shared-components/le-progress-overview-missions';
import { useDebounceCallback } from 'usehooks-ts';
import { ILreOccurrenceProgress, ILreProgressModel } from 'src/v2/features/lre/lre.models';
import { LreTrackOverallProgress } from 'src/shared-components/le-track-overall-progress';
import { LreTrackId } from 'src/models/interfaces';

interface Props {
    model: ILreProgressModel;
    notesChange: (value: string) => void;
    occurenceProgressChange: (value: ILreOccurrenceProgress) => void;
    toggleBattleState: (trackId: LreTrackId, battleIndex: number, reqId: string) => void;
}

export const LeProgressOverview: React.FC<Props> = ({
    model,
    occurenceProgressChange,
    notesChange,
    toggleBattleState,
}) => {
    const [accordionExpanded, setAccordionExpanded] = React.useState<string | false>('tracks');

    const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setAccordionExpanded(isExpanded ? section : false);
    };

    const missionsTotalProgress = model.occurrenceProgress.map(x => x.freeMissionsProgress.toString()).join('-');
    return (
        <>
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
                        helperText={model.notes.length + '/1000'}
                        onChange={event => notesChange(event.target.value.slice(0, 1000))}
                    />

                    {model.occurrenceProgress.map(occurence => (
                        <LeProgressOverviewMissions
                            key={occurence.eventOccurrence}
                            occurence={occurence}
                            progressChange={occurenceProgressChange}
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
                    <span>
                        Tracks Progress <span className="bold">({missionsTotalProgress})</span>
                    </span>
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
        </>
    );
};
