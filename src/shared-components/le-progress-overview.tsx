import React, { useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import {
    ILegendaryEventBattle,
    ILegendaryEventProgress,
    ILegendaryEventProgressTrack,
    ILegendaryEventTrackRequirement
} from '../models/interfaces';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCompletionRateColor } from '../shared-logic/functions';

export const LeProgressOverview = ({ progress }: { progress: ILegendaryEventProgress }) => {
    const [accordionExpanded, setAccordionExpanded] = React.useState<string | false>(false);

    const handleAccordionChange =
        (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
            setAccordionExpanded(isExpanded ? section : false);
        };

    const getBackgroundColor = (track: 'alpha' | 'beta' | 'gamma'): string => {
        const trackProgress = progress[track];
        const numberOfCompleted = trackProgress.battles.flatMap(battle => battle.state).filter(x => x).length;
        
        return getCompletionRateColor(numberOfCompleted, trackProgress.battles.length * trackProgress.requirements.length);
    };


    return (
        <div>
            <Accordion TransitionProps={{ unmountOnExit: true }}  expanded={accordionExpanded === 'alpha'} onChange={handleAccordionChange('alpha')} style={{
                borderInlineStartWidth: 10,
                borderInlineStartColor: getBackgroundColor('alpha'),
                borderInlineStartStyle: 'solid'
            }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>
                    <TrackSummary title={'Alpha'} trackProgress={progress.alpha}/>
                </AccordionSummary>
                <AccordionDetails>
                    <TrackDetails trackProgress={progress.alpha}/>
                </AccordionDetails>
            </Accordion>

            <Accordion TransitionProps={{ unmountOnExit: true }}  expanded={accordionExpanded === 'beta'} onChange={handleAccordionChange('beta')} style={{
                borderInlineStartWidth: 10,
                borderInlineStartColor: getBackgroundColor('beta'),
                borderInlineStartStyle: 'solid'
            }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>
                    <TrackSummary title={'Beta'} trackProgress={progress.beta}/>
                </AccordionSummary>
                <AccordionDetails>
                    <TrackDetails trackProgress={progress.beta}/>
                </AccordionDetails>
            </Accordion>

            <Accordion TransitionProps={{ unmountOnExit: true }}  expanded={accordionExpanded === 'gamma'} onChange={handleAccordionChange('gamma')} style={{
                borderInlineStartWidth: 10,
                borderInlineStartColor: getBackgroundColor('gamma'),
                borderInlineStartStyle: 'solid'
            }}>
                <AccordionSummary expandIcon={
                    <ExpandMoreIcon/>}>
                    <TrackSummary title={'Gamma'} trackProgress={progress.gamma}/>
                </AccordionSummary>
                <AccordionDetails>
                    <TrackDetails trackProgress={progress.gamma}/>
                </AccordionDetails>
            </Accordion>
        </div>
    );
};

const TrackSummary = ({ title, trackProgress }: { title: string, trackProgress: ILegendaryEventProgressTrack}) => {
    const totalBattles = useMemo(() => trackProgress.requirements.length * trackProgress.battles.length, []) ;
    const currentBattles = useMemo(() => trackProgress.battles.flatMap(x => x.state).filter(x => x).length, []);

    const totalPoints = useMemo(() =>  trackProgress.requirements.map(x => x.points).reduce((accumulator, currentValue) => accumulator + currentValue, 0) * trackProgress.battles.length, []);
    const currentPoints = useMemo(() => {
        let total = 0;

        trackProgress.battles.forEach(battle => {
            battle.state.forEach((value, index) => {
                if(value) {
                    total += trackProgress.requirements[index].points;
                }
            });
        });

        return total;
    }, []);


    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ marginInlineEnd: 10 }}>{title}</span>
            <span style={{ marginInlineEnd: 10, fontWeight: 700 }}>{currentBattles}/{totalBattles}</span>
            <span style={{ marginInlineEnd: 10, fontWeight: 700 }}>{currentPoints}/{totalPoints}</span>
        </div>
    );
};

const TrackDetails = ({ trackProgress }: { trackProgress: ILegendaryEventProgressTrack}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {trackProgress.requirements.map((req, index) =>
                <RequirementDetails key={req.name} req={req} battles={trackProgress.battles} reqIndex={index}/>
            )}
        </div>
    );
};

const RequirementDetails = ({ req, battles, reqIndex }: {req: ILegendaryEventTrackRequirement, battles: ILegendaryEventBattle[], reqIndex: number}) => {
    const completedBattles = useMemo(() => {
        let total = 0;
        
        battles.forEach(battle => {
            if(battle.state[reqIndex]) {
                total ++;
            }
        });

        return total;
    }, [reqIndex]);

    const scoredPoints = useMemo(() => {
        let total = 0;

        battles.forEach(battle => {
            if(battle.state[reqIndex]) {
                total += req.points;
            }
        });

        return total;
    },[]);
    
    return (
        <div key={req.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{req.name}</span>
            <span style={{ fontWeight: 700 }}>{completedBattles}/{battles.length}</span>
            <span style={{ fontWeight: 700 }}>{scoredPoints}/{req.points * battles.length}</span>
            <div style={{
                width: 15,
                height: 15,
                backgroundColor: getCompletionRateColor(completedBattles, battles.length),
                borderRadius: 50
            }}></div>
        </div>
    );
};