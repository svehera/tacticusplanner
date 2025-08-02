import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, TextField } from '@mui/material';
import { sum } from 'lodash';
import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { ILegendaryEvent } from '@/fsd/3-features/lre';

import { LeNextGoalProgress } from './le-next-goal-progress';
import { LeProgressOverviewMissions } from './le-progress-overview-missions';
import { useLreProgress } from './le-progress.hooks';
import { LeTokenomics } from './le-tokenomics';
import { LreTrackOverallProgress } from './le-track-overall-progress';
import { TokenEstimationService } from './token-estimation-service';

/**
 * UI Element to display the progress of missions and tracks in a legendary event.
 */
export const LeProgress = ({ legendaryEvent }: { legendaryEvent: ILegendaryEvent }) => {
    const { model, updateNotes, updateOccurrenceProgress, toggleBattleState } = useLreProgress(legendaryEvent);
    const { leSelectedTeams } = useContext(StoreContext);
    const [accordionExpanded, setAccordionExpanded] = React.useState<string | false>('tracks');

    const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setAccordionExpanded(isExpanded ? section : false);
    };

    const tokens = useMemo(() => {
        return TokenEstimationService.computeAllTokenUsage(
            model.tracksProgress,
            leSelectedTeams[legendaryEvent.id]?.teams ?? []
        );
    }, [model, leSelectedTeams, legendaryEvent]);

    const currentPoints = useMemo(() => {
        return model.tracksProgress
            .map(track => TokenEstimationService.computeCurrentPoints(track))
            .reduce((a, b) => a + b, 0);
    }, [model, legendaryEvent]);

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
                            legendaryEventId={legendaryEvent.id}
                            toggleBattleState={toggleBattleState}
                        />
                    ))}
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div className="flex-box gap5">
                        <span>Tokenomics</span>
                    </div>
                </AccordionSummary>
                <AccordionDetails className="flex-box column start">
                    <LeTokenomics key="tokenomics" tokens={tokens} currentPoints={currentPoints} />
                </AccordionDetails>
            </Accordion>
        </div>
    );
};
