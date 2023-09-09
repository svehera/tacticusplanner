import React, { useContext, useMemo, useState } from 'react';

import { ICharacter, ILegendaryEvent, ILegendaryEventData3, LegendaryEventSection } from '../../models/interfaces';
import { ViewSettingsContext } from '../../contexts';
import { LegendaryEventTrack } from './legendary-event-track';
import { SelectedTeamsTable } from './selected-teams-table';
import { GlobalService, PersonalDataService } from '../../services';

import DataTablesDialog from './data-tables-dialog';
import { Info } from '@mui/icons-material';
import { FormControl, MenuItem, Select, Tooltip } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { orderBy } from 'lodash';

const LegendaryEvent = (props: {
    legendaryEvent: ILegendaryEvent;
    legendaryEventPersonal: ILegendaryEventData3;
    legendaryEventPersonalChange: (selectedTeams: ILegendaryEventData3) => void;
}) => {
    const viewPreferences = useContext(ViewSettingsContext);
    const { legendaryEventPersonal, legendaryEvent, legendaryEventPersonalChange } = props;
    
    const [selectedTeams, setSelectedTeams] = useState({
        alpha: legendaryEventPersonal.alpha,
        beta: legendaryEventPersonal.beta,
        gamma: legendaryEventPersonal.gamma,
    });

    const [order, setOrder] = React.useState<'name' | 'rank' | 'rarity'>(PersonalDataService.data.selectedTeamOrder.orderBy);
    const [direction, setDirection] = React.useState<'asc' | 'desc'>(PersonalDataService.data.selectedTeamOrder.direction);
    
    const selectChars = (section: LegendaryEventSection) => ( team: string, ...chars: string[]) => {
        setSelectedTeams((value) => {
            const currentTeam = value[section][team] ?? [];
            if(currentTeam.length === 5) {
                return value;
            }

            const newChars = chars.filter(x => !currentTeam.includes(x));

            if(!newChars.length) {
                return value;
            }
            value[section] = {
                ...value[section],
                [team]: [...currentTeam, ...newChars].slice(0,5).filter(x => !!x)
            };
            const newValue = { ...value };
            legendaryEventPersonalChange( { id: legendaryEvent.id, ...newValue });
            return newValue;
            
        });
    };

    const deselectChars = (section: LegendaryEventSection) => ( team: string, ...chars: string[]) => {
        setSelectedTeams((value) => {
            const currentTeam = value[section][team];

            value[section] = {
                ...value[section],
                [team]: currentTeam.filter(x => !chars.includes(x))
            };
            const newValue = { ...value };
            legendaryEventPersonalChange( { id: legendaryEvent.id, ...newValue });
            return newValue;
        });
    };
    
    const alphaSelectedChars = useMemo(() => {
        const result: Record<string, Array<ICharacter | string>> = {};
        for (const teamKey in selectedTeams.alpha) {
            const team = selectedTeams.alpha[teamKey].map(charName => GlobalService.characters.find(x => x.name === charName) ?? '');
            result[teamKey] = orderBy(team, order, direction);
        }
        return result;
    }, [order, selectedTeams.alpha, direction]);

    const betaSelectedChars = useMemo(() => {
        const result: Record<string, Array<ICharacter | string>> = {};
        for (const teamKey in selectedTeams.beta) {
            const team = selectedTeams.beta[teamKey].map(charName => GlobalService.characters.find(x => x.name === charName) ?? '');
            result[teamKey] = orderBy(team, order, direction);
        }
        return result;
    }, [order, selectedTeams.beta, direction]);

    const gammaSelectedChars = useMemo(() => {
        const result: Record<string, Array<ICharacter | string>> = {};
        for (const teamKey in selectedTeams.gamma) {
            const team = selectedTeams.gamma[teamKey].map(charName => GlobalService.characters.find(x => x.name === charName) ?? '');
            result[teamKey] = orderBy(team, order, direction);
        }
        return result;
    }, [order, selectedTeams.gamma, direction]);
    

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex' }}>
                    <span>Recommended teams</span>
                    <Tooltip title={'Click - adds single char, Shift + Click - adds top 5 chars'}><Info/></Tooltip>
                </div>
                <DataTablesDialog legendaryEvent={legendaryEvent} ></DataTablesDialog>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 10 }}>
                {viewPreferences.showAlpha ? (<LegendaryEventTrack key={legendaryEvent.alphaTrack.name + legendaryEvent.id} track={legendaryEvent.alphaTrack} selectChars={selectChars('alpha')}/>) : undefined }
                {viewPreferences.showBeta ? (<LegendaryEventTrack key={legendaryEvent.betaTrack.name + legendaryEvent.id} track={legendaryEvent.betaTrack} selectChars={selectChars('beta')}/>) : undefined }
                {viewPreferences.showGamma ? (<LegendaryEventTrack key={legendaryEvent.gammaTrack.name + legendaryEvent.id} track={legendaryEvent.gammaTrack} selectChars={selectChars('gamma')}/>) : undefined }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                <div style={{ display: 'flex' }}>
                    <span>Selected teams</span>
                    <Tooltip title={'Click - removes single char, Shift + Click - remove whole team'}><Info/></Tooltip>
                </div>
                
                <FormControl sx={{ width: 200 }} size={'small'}>
                    <InputLabel id="order-by-label">Order By</InputLabel>
                    <Select
                        labelId="order-by-label"
                        id="order-by"
                        value={order}
                        label="Order By"
                        onChange={event => {
                            const value = event.target.value as any;
                            setOrder(value);
                            PersonalDataService.data.selectedTeamOrder.orderBy = value;
                            PersonalDataService.save();
                        }}
                    >
                        <MenuItem value={'name'}>Name</MenuItem>
                        <MenuItem value={'rarity'}>Rarity</MenuItem>
                        <MenuItem value={'rank'}>Rank</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={{ width: 200 }} size={'small'}>
                    <InputLabel id="direction-label">Direction</InputLabel>
                    <Select
                        labelId="direction-label"
                        id="direction"
                        value={direction}
                        label="Direction"
                        onChange={event => {
                            const value = event.target.value as any;
                            setDirection(value);
                            PersonalDataService.data.selectedTeamOrder.direction = value;
                            PersonalDataService.save();
                        }}
                    >
                        <MenuItem value={'asc'}>Ascending</MenuItem>
                        <MenuItem value={'desc'}>Descending</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <div style={{ display: 'flex', gap: 15 }}>
                {viewPreferences.showAlpha ? (<SelectedTeamsTable key={legendaryEvent.alphaTrack.name + legendaryEvent.id} track={legendaryEvent.alphaTrack}  teams={alphaSelectedChars} deselectChars={deselectChars('alpha')}/>) : undefined }
                {viewPreferences.showBeta ? (<SelectedTeamsTable key={legendaryEvent.betaTrack.name + legendaryEvent.id} track={legendaryEvent.betaTrack}  teams={betaSelectedChars} deselectChars={deselectChars('beta')}/> ) : undefined }
                {viewPreferences.showGamma ? (<SelectedTeamsTable key={legendaryEvent.gammaTrack.name + legendaryEvent.id} track={legendaryEvent.gammaTrack}  teams={gammaSelectedChars} deselectChars={deselectChars('gamma')}/>) : undefined }
            </div>
        </div>
    );
};

export default LegendaryEvent;