import React, { useMemo } from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Checkbox,
    Divider,
    FormControlLabel,
    TextField,
} from '@mui/material';
import {
    ILegendaryEvent,
    ILegendaryEventBattle,
    ILegendaryEventOverviewProgress,
    ILegendaryEventProgress,
    ILegendaryEventProgressTrack,
} from '../models/interfaces';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCompletionRateColor } from '../shared-logic/functions';
import { Tooltip } from '@mui/material';
import { LeProgressOverviewMissions } from 'src/shared-components/le-progress-overview-missions';

export const LeProgressOverview = ({
    progress,
    legendaryEvent,
    notesChange,
    progressChange,
}: {
    progress: ILegendaryEventProgress;
    legendaryEvent: ILegendaryEvent;
    notesChange: (value: string) => void;
    progressChange: (value: ILegendaryEventProgress) => void;
}) => {
    const [accordionExpanded, setAccordionExpanded] = React.useState<string | false>(false);

    const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setAccordionExpanded(isExpanded ? section : false);
    };

    const handleMissionsProgressChange =
        (current: ILegendaryEventOverviewProgress) =>
        (section: 'regularMissions' | 'premiumMissions', value: number): void => {
            current[section] = value;
            progressChange(progress);
        };

    const handleBundleChange =
        (current: ILegendaryEventOverviewProgress) =>
        (value: number): void => {
            current.bundle = value;
            progressChange(progress);
        };

    return (
        <div>
            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                expanded={accordionExpanded === 'notes'}
                onChange={handleAccordionChange('notes')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>Notes</span>
                    </div>
                </AccordionSummary>
                <AccordionDetails>
                    <TextField
                        style={{ marginTop: 20 }}
                        fullWidth
                        id="outlined-textarea"
                        label="Notes"
                        placeholder="Notes"
                        multiline
                        helperText={progress.notes.length + '/1000'}
                        value={progress.notes}
                        onChange={event => notesChange(event.target.value.slice(0, 1000))}
                    />
                </AccordionDetails>
            </Accordion>

            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                expanded={accordionExpanded === 'event1'}
                onChange={handleAccordionChange('event1')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>
                            Event 1 Missions & Bundles{' '}
                            <span style={{ fontWeight: 700 }}>
                                ({progress.overview['1'].regularMissions}/10 & {progress.overview['1'].premiumMissions}
                                /10)
                            </span>
                        </span>
                    </div>
                </AccordionSummary>
                <LeProgressOverviewMissions
                    progress={progress.overview['1']}
                    legendaryEvent={legendaryEvent}
                    missionProgressChange={handleMissionsProgressChange(progress.overview['1'])}
                    bundleChange={handleBundleChange(progress.overview['1'])}
                />
            </Accordion>

            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                expanded={accordionExpanded === 'event2'}
                onChange={handleAccordionChange('event2')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>
                            Event 2 Missions & Bundles{' '}
                            <span style={{ fontWeight: 700 }}>
                                ({progress.overview['2'].regularMissions}/10 & {progress.overview['2'].premiumMissions}
                                /10)
                            </span>
                        </span>
                    </div>
                </AccordionSummary>
                <LeProgressOverviewMissions
                    progress={progress.overview['2']}
                    legendaryEvent={legendaryEvent}
                    missionProgressChange={handleMissionsProgressChange(progress.overview['2'])}
                    bundleChange={handleBundleChange(progress.overview['2'])}
                />
            </Accordion>

            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                expanded={accordionExpanded === 'event3'}
                onChange={handleAccordionChange('event3')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>
                            Event 3 Missions & Bundles{' '}
                            <span style={{ fontWeight: 700 }}>
                                ({progress.overview['3'].regularMissions}/10 & {progress.overview['3'].premiumMissions}
                                /10)
                            </span>
                        </span>
                    </div>
                </AccordionSummary>
                <LeProgressOverviewMissions
                    progress={progress.overview['3']}
                    legendaryEvent={legendaryEvent}
                    missionProgressChange={handleMissionsProgressChange(progress.overview['3'])}
                    bundleChange={handleBundleChange(progress.overview['3'])}
                />
            </Accordion>

            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                defaultExpanded={true}
                onChange={handleAccordionChange('alpha')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <TrackSummary title={'Alpha'} trackProgress={progress.alpha} />
                </AccordionSummary>
                <AccordionDetails>
                    <TrackDetails trackProgress={progress.alpha} />
                </AccordionDetails>
            </Accordion>

            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                defaultExpanded={true}
                onChange={handleAccordionChange('beta')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <TrackSummary title={'Beta'} trackProgress={progress.beta} />
                </AccordionSummary>
                <AccordionDetails>
                    <TrackDetails trackProgress={progress.beta} />
                </AccordionDetails>
            </Accordion>

            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                defaultExpanded={true}
                onChange={handleAccordionChange('gamma')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <TrackSummary title={'Gamma'} trackProgress={progress.gamma} />
                </AccordionSummary>
                <AccordionDetails>
                    <TrackDetails trackProgress={progress.gamma} />
                </AccordionDetails>
            </Accordion>
        </div>
    );
};

const TrackSummary = ({ title, trackProgress }: { title: string; trackProgress: ILegendaryEventProgressTrack }) => {
    const totalBattles = useMemo(() => trackProgress.battles.flatMap(b => b.requirements).length, []);
    const currentBattles = useMemo(() => trackProgress.battles.flatMap(x => x.state).filter(x => x).length, []);

    const totalPoints = useMemo(
        () =>
            trackProgress.battles
                .flatMap(b => b.requirements)
                .map(x => x.points)
                .reduce((accumulator, currentValue) => accumulator + currentValue, 0),
        []
    );
    const currentPoints = useMemo(() => {
        let total = 0;

        trackProgress.battles.forEach(battle => {
            battle.state.forEach((value, index) => {
                if (value) {
                    total += battle.requirements[index].points;
                }
            });
        });

        return total;
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ marginInlineEnd: 10 }}>{title}</span>
            <Tooltip title={`${currentBattles}/${totalBattles} Requirements`}>
                <span style={{ marginInlineEnd: 10, fontWeight: 700 }}>
                    {currentPoints}/{totalPoints} Points
                </span>
            </Tooltip>
        </div>
    );
};

const TrackDetails = ({ trackProgress }: { trackProgress: ILegendaryEventProgressTrack }) => {
    const requirements = trackProgress.battles[0].requirements.map(x => x.name);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {requirements.map((reqName, index) => (
                <RequirementDetails key={reqName} reqName={reqName} battles={trackProgress.battles} reqIndex={index} />
            ))}
        </div>
    );
};

const RequirementDetails = ({
    reqName,
    battles,
    reqIndex,
}: {
    reqName: string;
    battles: ILegendaryEventBattle[];
    reqIndex: number;
}) => {
    const completedBattles = useMemo(() => {
        let total = 0;

        battles.forEach(battle => {
            if (battle.state[reqIndex]) {
                total++;
            }
        });

        return total;
    }, [reqIndex]);

    const scoredPoints = useMemo(() => {
        let total = 0;

        battles.forEach(battle => {
            if (battle.state[reqIndex]) {
                total += battle.requirements[reqIndex].points;
            }
        });

        return total;
    }, []);

    const totalPoints = useMemo(() => {
        return battles
            .map(x => x.requirements[reqIndex].points)
            .reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
                style={{
                    width: 15,
                    height: 15,
                    backgroundColor: getCompletionRateColor(completedBattles, battles.length),
                    borderRadius: 50,
                }}></div>
            <Tooltip title={`${scoredPoints}/${totalPoints} Points`}>
                <span style={{ fontWeight: 700 }}>
                    {completedBattles}/{battles.length}
                </span>
            </Tooltip>
            <span>{reqName}</span>
        </div>
    );
};
