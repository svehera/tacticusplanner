import React, { useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, TextField } from '@mui/material';
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
import { useDebounceCallback } from 'usehooks-ts';

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
    const debounced = useDebounceCallback(notesChange, 500);
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
            <TextField
                style={{ marginTop: 20 }}
                fullWidth
                id="outlined-textarea"
                label="Notes"
                placeholder="Notes"
                multiline
                helperText={progress.notes.length + '/1000'}
                defaultValue={progress.notes}
                onChange={event => debounced(event.target.value.slice(0, 1000))}
            />

            <Accordion
                TransitionProps={{ unmountOnExit: true }}
                expanded={accordionExpanded === 'event1'}
                onChange={handleAccordionChange('event1')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>
                            Missions & Bundles{' '}
                            <span className="bold">
                                ({progress.overview['1'].regularMissions}-{progress.overview['2'].regularMissions}-
                                {progress.overview['3'].regularMissions})
                            </span>
                            {/*{' '}*/}
                            {/*<span style={{ fontWeight: 700 }}>*/}
                            {/*    ({progress.overview['1'].regularMissions}/10 & {progress.overview['1'].premiumMissions}*/}
                            {/*    /10)*/}
                            {/*</span>*/}
                        </span>
                    </div>
                </AccordionSummary>

                <AccordionDetails className="flex-box wrap gap20">
                    {([1, 2, 3] as Array<1 | 2 | 3>).map(eventNumber => (
                        <div key={eventNumber} style={{ overflow: 'auto' }}>
                            <h3>
                                Event {eventNumber}{' '}
                                <span className="bold">
                                    ({progress.overview[eventNumber].regularMissions}-
                                    {progress.overview[eventNumber].premiumMissions}-
                                    {progress.overview[eventNumber].bundle})
                                </span>
                            </h3>
                            <LeProgressOverviewMissions
                                progress={progress.overview[eventNumber]}
                                legendaryEvent={legendaryEvent}
                                missionProgressChange={handleMissionsProgressChange(progress.overview[eventNumber])}
                                bundleChange={handleBundleChange(progress.overview[eventNumber])}
                            />
                        </div>
                    ))}
                </AccordionDetails>
            </Accordion>

            <div className="flex-box wrap between">
                <div>
                    <TrackSummary title={'Alpha'} trackProgress={progress.alpha} />
                    <TrackDetails trackProgress={progress.alpha} />
                </div>

                <div>
                    <TrackSummary title={'Beta'} trackProgress={progress.beta} />
                    <TrackDetails trackProgress={progress.beta} />
                </div>

                <div>
                    <TrackSummary title={'Gamma'} trackProgress={progress.gamma} />
                    <TrackDetails trackProgress={progress.gamma} />
                </div>

                {/*<Accordion*/}
                {/*    TransitionProps={{ unmountOnExit: true }}*/}
                {/*    defaultExpanded={true}*/}
                {/*    onChange={handleAccordionChange('alpha')}>*/}
                {/*    <AccordionSummary expandIcon={<ExpandMoreIcon />}>*/}
                {/*        <TrackSummary title={'Alpha'} trackProgress={progress.alpha} />*/}
                {/*    </AccordionSummary>*/}
                {/*    <AccordionDetails>*/}
                {/*        <TrackDetails trackProgress={progress.alpha} />*/}
                {/*    </AccordionDetails>*/}
                {/*</Accordion>*/}

                {/*<Accordion*/}
                {/*    TransitionProps={{ unmountOnExit: true }}*/}
                {/*    defaultExpanded={true}*/}
                {/*    onChange={handleAccordionChange('beta')}>*/}
                {/*    <AccordionSummary expandIcon={<ExpandMoreIcon />}>*/}
                {/*        <TrackSummary title={'Beta'} trackProgress={progress.beta} />*/}
                {/*    </AccordionSummary>*/}
                {/*    <AccordionDetails>*/}
                {/*        <TrackDetails trackProgress={progress.beta} />*/}
                {/*    </AccordionDetails>*/}
                {/*</Accordion>*/}

                {/*<Accordion*/}
                {/*    TransitionProps={{ unmountOnExit: true }}*/}
                {/*    defaultExpanded={true}*/}
                {/*    onChange={handleAccordionChange('gamma')}>*/}
                {/*    <AccordionSummary expandIcon={<ExpandMoreIcon />}>*/}
                {/*        <TrackSummary title={'Gamma'} trackProgress={progress.gamma} />*/}
                {/*    </AccordionSummary>*/}
                {/*    <AccordionDetails>*/}
                {/*        <TrackDetails trackProgress={progress.gamma} />*/}
                {/*    </AccordionDetails>*/}
                {/*</Accordion>*/}
            </div>
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
