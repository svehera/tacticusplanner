import React, { ChangeEvent, useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Checkbox, FormControlLabel } from '@mui/material';
import { ILegendaryEventBattle, ILegendaryEventProgressTrack } from '../models/interfaces';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getCompletionRateColor } from '../shared-logic/functions';

export const LeTrackProgress = ({ trackProgress, onStateUpdate }: { trackProgress: ILegendaryEventProgressTrack, onStateUpdate: (battles: ILegendaryEventBattle[]) => void }) => {
    const [battles, setBattles] = useState<ILegendaryEventBattle[]>(trackProgress.battles);
    const [accordionExpanded, setAccordionExpanded] = React.useState<number | false>(() => {
        for (let i = 0; i < trackProgress.battles.length; i++) {
            const battle = trackProgress.battles[i];
            if(!battle.state.some(x => x)) {
                return battle.battleNumber;
            }
        }
        
        for (let i = 0; i < trackProgress.battles.length; i++) {
            const battle = trackProgress.battles[i];
            if(!battle.state.every(x => x)) {
                return battle.battleNumber; 
            }
        }
        
        return false;
    });
    const handleChange = (event: ChangeEvent<HTMLInputElement>, updatedBattle: ILegendaryEventBattle, index: number) => {
        setBattles(currentBattles => {
            const battle = currentBattles.find(x => x.battleNumber === updatedBattle.battleNumber);
            if (!battle) {
                return currentBattles;
            }
            battle.state[index] = event.target.checked;
            battle.state = [...battle.state];
            onStateUpdate([...currentBattles]);
            return [...currentBattles];
        });
    };

    const toggleAll = (selected: boolean, updatedBattle: ILegendaryEventBattle) => {
        setBattles(currentBattles => {
            const battle = currentBattles.find(x => x.battleNumber === updatedBattle.battleNumber);
            if (!battle) {
                return currentBattles;
            }
            battle.state = battle.state.map(() => selected);
            onStateUpdate([...currentBattles]);
            if (selected) {
                setAccordionExpanded(battle.battleNumber + 1);
            } else {
                setAccordionExpanded(battle.battleNumber);
            }
            return [...currentBattles];
        });
    };

    const handleAccordionChange =
        (battleNumber: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
            setAccordionExpanded(isExpanded ? battleNumber : false);
        };
    
    const getBackgroundColor = (state: boolean[]): string => {
        const numberOfCompleted = state.filter(x => x).length;
        
        return getCompletionRateColor(numberOfCompleted, state.length);
    };


    return (
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
            {
                battles.map(battle => (
                    <Accordion key={battle.battleNumber} TransitionProps={{ unmountOnExit: true }}
                        expanded={accordionExpanded === battle.battleNumber}
                        onChange={handleAccordionChange(battle.battleNumber)}
                        style={{
                            borderInlineStartWidth: 10,
                            borderInlineStartColor: getBackgroundColor(battle.state),
                            borderInlineStartStyle: 'solid'
                        }}>
                        <AccordionSummary expandIcon={
                            <ExpandMoreIcon/>}>
                            <BattleSummary battle={battle} masterCheckboxChange={value => toggleAll(value, battle)}/>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {battle.requirements.map((req, index) =>
                                    <FormControlLabel key={req.name} control={<Checkbox
                                        checked={battle.state[index]}
                                        value={battle.state[index] ?? false}
                                        onChange={event => handleChange(event, battle, index)}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    />} label={req.name + `(${req.points})`}/>
                                )}
                            </div>
                        </AccordionDetails>
                    </Accordion>
                ))
            }
        </div>
    );
};

const BattleSummary = ({ battle, masterCheckboxChange }: { battle: ILegendaryEventBattle, masterCheckboxChange: (value: boolean) => void }) => {
    
    const currentPoints = useMemo(() => {
        let total = 0;

        battle.state.forEach((value, index) => {
            if (value) {
                total += battle.requirements[index].points;
            }
        });

        return total;
    }, [battle.state]);
    
    const totalPoints = useMemo(() => battle.requirements.map(x => x.points).reduce((accumulator, currentValue) => accumulator + currentValue, 0), []);
    
    const completedSections = battle.state.filter(x => x).length;
    const totalSections = battle.state.length;
    
    const allCompleted = useMemo(() => battle.state.every(x => x), [battle.state]);
    const someCompleted = useMemo(() => battle.state.some(x => x), [battle.state]);
    
    return (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ marginInlineEnd: 10 }}>Battle {battle.battleNumber}</span>
            <span style={{ marginInlineEnd: 10, fontWeight: 700 }}>{completedSections}/{totalSections}</span>
            <span style={{ marginInlineEnd: 10, fontWeight: 700 }}>{currentPoints}/{totalPoints}</span>
            <Checkbox
                onClick={event => event.stopPropagation()}
                checked={allCompleted}
                indeterminate={!allCompleted && someCompleted}
                onChange={() => masterCheckboxChange(!allCompleted)}
                inputProps={{ 'aria-label': 'controlled' }}
            />
        </div>
    );
};