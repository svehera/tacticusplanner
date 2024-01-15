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
    ILegendaryEventProgress,
    ILegendaryEventProgressTrack,
} from '../models/interfaces';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCompletionRateColor } from '../shared-logic/functions';
import { Tooltip } from '@mui/material';

export const LeProgressOverview = ({
    progress,
    legendaryEvent,
    missionProgressChange,
    notesChange,
    bundleChange,
}: {
    progress: ILegendaryEventProgress;
    legendaryEvent: ILegendaryEvent;
    missionProgressChange: (section: 'regularMissions' | 'premiumMissions', value: number) => void;
    notesChange: (value: string) => void;
    bundleChange: (value: number) => void;
}) => {
    const [accordionExpanded, setAccordionExpanded] = React.useState<string | false>(false);

    const [regularMissionsProgress, setRegularMissionsProgress] = React.useState<number>(progress.regularMissions);
    const [premiumMissionsProgress, setPremiumMissionsProgress] = React.useState<number>(progress.premiumMissions);
    const [bundle, setBundle] = React.useState<number>(progress.bundle);

    const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setAccordionExpanded(isExpanded ? section : false);
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

            {legendaryEvent.regularMissions.length ? (
                <Accordion
                    TransitionProps={{ unmountOnExit: true }}
                    expanded={accordionExpanded === 'regularMissions'}
                    onChange={handleAccordionChange('regularMissions')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>Regular Missions</span>
                            <span style={{ fontWeight: 700 }}>
                                {regularMissionsProgress}/{10}
                            </span>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {legendaryEvent.regularMissions.map((mission, index) => (
                                <FormControlLabel
                                    key={mission}
                                    control={
                                        <Checkbox
                                            checked={index < regularMissionsProgress}
                                            onChange={(_, checked) => {
                                                setRegularMissionsProgress(checked ? index + 1 : index);
                                                missionProgressChange('regularMissions', checked ? index + 1 : index);
                                            }}
                                            inputProps={{ 'aria-label': 'controlled' }}
                                        />
                                    }
                                    label={index + 1 + '. ' + mission}
                                />
                            ))}
                        </div>
                    </AccordionDetails>
                </Accordion>
            ) : undefined}

            {legendaryEvent.premiumMissions.length ? (
                <Accordion
                    TransitionProps={{ unmountOnExit: true }}
                    expanded={accordionExpanded === 'premiumMissions'}
                    onChange={handleAccordionChange('premiumMissions')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>Premium Missions & 300 Bundle</span>
                            <span style={{ fontWeight: 700 }}>
                                {premiumMissionsProgress}/{10}
                            </span>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={bundle > 0}
                                        onChange={(_, checked) => {
                                            setBundle(checked ? 1 : 0);
                                            bundleChange(checked ? 1 : 0);
                                        }}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    />
                                }
                                label={'300 Bundle'}
                            />
                            <Divider />
                            {legendaryEvent.premiumMissions.map((mission, index) => (
                                <FormControlLabel
                                    key={mission}
                                    control={
                                        <Checkbox
                                            checked={index < premiumMissionsProgress}
                                            onChange={(_, checked) => {
                                                setPremiumMissionsProgress(checked ? index + 1 : index);
                                                missionProgressChange('premiumMissions', checked ? index + 1 : index);
                                            }}
                                            inputProps={{ 'aria-label': 'controlled' }}
                                        />
                                    }
                                    label={index + 1 + '. ' + mission}
                                />
                            ))}
                        </div>
                    </AccordionDetails>
                </Accordion>
            ) : undefined}

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
