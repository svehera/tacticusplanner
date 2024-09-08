import React, { useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, Divider, FormControlLabel } from '@mui/material';
import { ILegendaryEvent, ILegendaryEventBattle, ILegendaryEventOverviewProgress } from '../models/interfaces';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCompletionRateColor } from '../shared-logic/functions';
import { Tooltip } from '@mui/material';

export const LeProgressOverviewMissions = ({
    progress,
    legendaryEvent,
    missionProgressChange,
    bundleChange,
}: {
    progress: ILegendaryEventOverviewProgress;
    legendaryEvent: ILegendaryEvent;
    missionProgressChange: (section: 'regularMissions' | 'premiumMissions', value: number) => void;
    bundleChange: (value: number) => void;
}) => {
    const [regularMissionsProgress, setRegularMissionsProgress] = React.useState<number>(progress.regularMissions);
    const [premiumMissionsProgress, setPremiumMissionsProgress] = React.useState<number>(progress.premiumMissions);
    const [bundle, setBundle] = React.useState<number>(progress.bundle);

    return (
        <>
            <div className="flex-box wrap">
                <span style={{ minWidth: 130 }}>Free Missions</span>
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
                        style={{ margin: 0 }}
                        label={index + 1}
                        labelPlacement="top"
                        // label={index + 1 + '. ' + mission}
                    />
                ))}
            </div>
            <div className="flex-box wrap">
                <span style={{ minWidth: 130 }}>Premium Missions</span>
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
                        style={{ margin: 0 }}
                        label={''}
                        labelPlacement="top"
                    />
                ))}
            </div>
            <div className="flex-box wrap">
                <span style={{ minWidth: 130 }}>300 Bundle</span>
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
                    style={{ margin: 0 }}
                    label={''}
                    labelPlacement="top"
                />
            </div>
        </>
    );
};
